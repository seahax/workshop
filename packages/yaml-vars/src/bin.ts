#!/usr/bin/env node
import assert from 'node:assert';
import fs from 'node:fs/promises';

import YAML from 'yaml';

const USAGE = `
Usage: yaml-vars <filename> [<key>=<value> ...]

Terraform style input variables in any YAML file. All variables in the YAML
file are replaced, and the result is printed to STDOUT. Use a hyphen (-) for
the <filename> to read the input yaml from STDIN.
`;

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  help();
}

const [filename, ...keyValueArgs] = args;

assert.ok(filename, 'YAML input filename is required.');

const inputText = filename === '-' ? await readStdin() : await fs.readFile(filename, 'utf8');
const inputDocs = YAML.parseAllDocuments(inputText);
const inputVars = getInputVars(keyValueArgs);
const unusedInputVars = new Set(inputVars.keys());

for (const [docIndex, doc] of inputDocs.entries()) {
  const yamlVars = await getYamlVars(doc, docIndex);
  const unusedYamlVars = new Set(yamlVars.keys());

  doc.delete('${{vars}}');
  await YAML.visitAsync(doc, (type, node) => {
    if (type === 'key' || type == null) return;
    if (!YAML.isScalar(node)) return;
    if (typeof node.value !== 'string') return;
    if (!node.value.startsWith('${{vars.')) return;
    if (!node.value.endsWith('}}')) return;
    const key = node.value.slice(8, -2);
    unusedInputVars.delete(key);
    unusedYamlVars.delete(key);
    const yamlVar = yamlVars.get(key);
    assert.ok(yamlVar, `Variable "${key}" is not defined (doc: ${docIndex}).`);
    const inputVar = inputVars.get(key);
    if (inputVar !== undefined) return doc.createNode(getYamlInputValue(yamlVar.type, key, inputVar));
    assert.ok(yamlVar.default !== undefined, `Variable "${key}" argument is required (doc: ${docIndex}).`);
    return doc.createNode(yamlVar.default);
  });

  assert.ok(
    unusedYamlVars.size === 0,
    `Unused variable definitions in document #${docIndex}: ${Array.from(unusedYamlVars).map(
      (value) => JSON.stringify(value),
    ).join(', ')}`,
  );
}

assert.ok(unusedInputVars.size === 0,
  `Unused input variables: ${Array.from(unusedInputVars).map(
    (value) => JSON.stringify(value),
  ).join(', ')}
}`);

process.stdout.write(inputDocs.map((doc) => YAML.stringify(doc)).join(''));
process.exit(0);

function onError(err: unknown): void {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

function help(): void {
  console.log(USAGE.trim());
  process.exit(0);
}

async function readStdin(): Promise<string> {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function getInputVars(args: string[]): Map<string, string> {
  const results = new Map<string, string>();

  args.forEach((arg) => {
    const eqIndex = arg.indexOf('=');
    assert.ok(eqIndex !== -1, `Invalid variable arg "${arg}".`);
    const key = arg.slice(0, eqIndex);
    const value = arg.slice(eqIndex + 1);
    results.set(key, value);
  });

  return results;
}

async function getYamlVars(doc: YAML.Document, docIndex: number): Promise<Map<string, YamlVar>> {
  const node = doc.get('${{vars}}');

  if (!node) return new Map();

  assert.ok(YAML.isSeq(node), `Invalid variables array (document: ${docIndex}).`);

  const vars = node.items.map((def, defIndex) => {
    assert.ok(YAML.isMap(def), `Invalid variable definition (doc: ${docIndex}, def: ${defIndex}).`);

    const key = def.get('key');
    const type = def.get('type');
    const defaultValue = def.get('default');

    assert.ok(key !== undefined, `Missing variable definition key (doc: ${docIndex}, def: ${defIndex}).`);
    assert.ok(typeof key === 'string',
      `Variable definition key must be a string (doc: ${docIndex}, def: ${defIndex}).`,
    );
    assert.ok(type === undefined || type === 'string' || type === 'number' || type === 'boolean',
      `Variable definition type must be "string", "number", or "boolean" (doc: ${docIndex}, def: ${defIndex}).`,
    );
    assert.ok(
      !YAML.isNode(defaultValue),
      `Variable definition default must be scalar (doc: ${docIndex}, def: ${defIndex}).`,
    );

    return { key, type, default: defaultValue } as YamlVarInput;
  });

  const results = new Map<string, YamlVar>();

  (vars).forEach(({ key, type = 'string', default: defaultValue }) => {
    results.set(key, { type, default: defaultValue });
  });

  return results;
}

function getYamlInputValue(type: YamlVarType, key: string, value: string): unknown {
  if (type === 'boolean') {
    assert.ok(value === 'true' || value === 'false', `Variable "${key}" value is not a valid boolean.`);
    return value === 'true';
  }

  if (type === 'number') {
    const number = Number(value);
    assert.ok(!Number.isNaN(number), `Variable "${key}" value is not a valid number.`);
    return number;
  }

  return value;
}

type YamlVarType = 'string' | 'number' | 'boolean';

interface YamlVarInput {
  key: string;
  type?: YamlVarType;
  default?: unknown;
}

interface YamlVar {
  type: YamlVarType;
  default?: unknown;
}
