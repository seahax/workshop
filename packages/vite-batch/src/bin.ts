import assert from 'node:assert';
import path from 'node:path';

import { createCommand } from '@seahax/args';
import { main } from '@seahax/main';
import { build, loadConfigFromFile } from 'vite';

await main(async () => {
  await createCommand()
    .usage('vite-batch [options]')
    .info(`Build multiple vite config files.`)
    .string('root', 'Directory containing a vite config file.')
    .variadic('names', {
      usage: '[names...]',
      info: 'Names of batch configs to build.',
    })
    .action(async ({ type, options }) => {
      if (type !== 'options') return;

      const configs = await loadConfigs(options);
      const cwd = process.cwd();
      let first = true;

      for (const [name, configFile] of Object.entries(configs)) {
        const root = path.dirname(configFile);

        if (first) {
          first = false;
        }
        else {
          console.log();
        }

        console.log(`Building Vite Config "${name}"...`);
        process.chdir(root);

        const loaded = await loadConfigFromFile({
          command: 'build',
          mode: 'production',
        }, configFile, root, 'silent');

        assert.ok(loaded, `Failed to load vite config "${configFile}".`);

        await build({
          root,
          ...loaded.config,
          configFile: false,
          clearScreen: false,
        });
      }

      process.chdir(cwd);
    })
    .parse(process.argv.slice(2));
});

async function loadConfigs(options: { root?: string; names: string[] }): Promise<Record<string, string>> {
  const { root = process.cwd(), names } = options;
  const loaded = await loadConfigFromFile({
    command: 'build',
    mode: 'production',
  }, 'vite.batch.ts', root, 'silent');

  assert.ok(loaded?.config, 'Missing vite.batch.ts file.');

  const config = loaded.config as Record<string, string>;
  const keys = Object.keys(config);

  for (const name of names) {
    assert.ok(keys.includes(name), `Vite batch key "${name}" not found.`);
    assert.ok(typeof config[name] === 'string', `Vite batch key "${name}" value is not a string.`);
  }

  return Object.fromEntries(
    Object.entries(config)
      .filter(([key]) => names.length === 0 || names.includes(key))
      .map(([key, value]) => [key, path.resolve(root, value)]),
  );
}
