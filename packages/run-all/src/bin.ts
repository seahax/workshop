import assert from 'node:assert';
import fs from 'node:fs/promises';

import { alias, createHelp, cue, option, parseOptions } from '@seahax/args';
import { main } from '@seahax/main';
import { execa } from 'execa';

export interface PackageJson {
  readonly scripts: Record<string, unknown>;
}

main(async () => {
  const options = await parseOptions(process.argv.slice(2), {
    '--help': cue('help'),
    '-h': alias('--help'),
    positional: option({ required: true, multiple: true }),
  });

  if (options.value === 'help') {
    help();
    return;
  }

  if (options.issues) {
    help.toStderr`{red ${options.issues[0]}}`;
    process.exitCode ||= 1;
    return;
  }

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
    await execa(packageManager, ['run', script], { stdio: 'inherit', preferLocal: true });
  }
});

function getPackageManager(): 'npm' | 'pnpm' | 'yarn' {
  const execPath = process.env.npm_execpath?.toLowerCase();

  assert.ok(execPath, 'The run-all command must be used in a package script.');

  if (execPath.includes('yarn')) return 'yarn';
  if (execPath.includes('pnpm')) return 'pnpm';
  if (execPath.includes('npm')) return 'npm';

  throw new Error('Unsupported package manager.');
}

export async function getScriptNames(): Promise<string[]> {
  try {
    return Object.keys(JSON.parse(await fs.readFile('package.json', 'utf8')).scripts);
  }
  catch {
    return [];
  }
}

const help = createHelp`
{bold Usage:} run-all <prefixes...>

Run all package.json scripts with a prefix.

{bold Options:}
  --help, -h      Show this help message.
  <prefixes...>   Prefixes of package.json scripts to run.
`;
