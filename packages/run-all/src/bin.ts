#!/usr/bin/env node
import assert from 'node:assert';
import fs from 'node:fs/promises';

import { alias, createHelp, cue, parseOptions, string } from '@seahax/args';
import { execa } from 'execa';

const help = createHelp`
{bold Usage:} run-all {green <prefixes...>} 
{bold Usage:} run-all {blue --help|-h} 

Run all package.json scripts that begin with one of the {blue prefixes}.

{bold Arguments:}
  {green <prefixes...>}   Prefixes of package.json scripts to run.

{bold Options:}
  {blue --help, -h}   Show this help message.
`;

await (async () => {
  const options = await parseOptions(process.argv.slice(2), {
    '--help': cue(),
    '-h': alias('--help'),
    extraPositional: string(),
  });

  if (options.value === '--help') {
    help();
    process.exit();
  }

  if (options.issues) return help.error`{red ${options.issues[0]}}`.exit(1);

  const { positional: prefixes } = options.value;
  const allScripts = await getScriptNames();
  const packageManager = getPackageManager();
  const scripts = new Set<string>();

  for (const prefix of prefixes) {
    for (const script of allScripts) {
      if (script.startsWith(prefix) && !prefixes.includes(script)) {
        scripts.add(script);
      }
    }
  }

  assert.ok(scripts.size > 0, 'No matching scripts found.');
  console.log(`Running Scripts: ${[...scripts].map((script) => `\n- ${script}`).join('')}`);

  for (const script of scripts) {
    const result = await execa(
      packageManager,
      ['run', script],
      { stdio: 'inherit', preferLocal: true, rejects: false },
    );

    if (result.exitCode !== 0) {
      process.exit(result.exitCode);
    }
  }
})();

function getPackageManager(): 'npm' | 'pnpm' | 'yarn' {
  const execPath = process.env.npm_execpath?.toLowerCase();

  assert.ok(execPath, 'The run-all command must be used in a package script.');

  if (execPath.includes('yarn')) return 'yarn';
  if (execPath.includes('pnpm')) return 'pnpm';
  if (execPath.includes('npm')) return 'npm';

  throw new Error('Unsupported package manager.');
}

async function getScriptNames(): Promise<string[]> {
  try {
    return Object.keys(JSON.parse(await fs.readFile('package.json', 'utf8')).scripts);
  }
  catch {
    return [];
  }
}
