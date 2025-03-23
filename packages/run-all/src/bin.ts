import assert from 'node:assert';
import fs from 'node:fs/promises';

import { createCommand } from '@seahax/args';
import { main } from '@seahax/main';
import { execa } from 'execa';

export interface PackageJson {
  readonly scripts: Record<string, unknown>;
}

await main(async () => {
  await createCommand()
    .usage('run-all <prefixes...>')
    .info('Run all package scripts with a prefix.')
    .variadic('prefixes', {
      info: 'Prefixes to run.',
      required: true,
    })
    .action(async ({ options }) => {
      if (!options) return;

      const { prefixes } = options;
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
    })
    .parse(process.argv.slice(2));
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
