import assert from 'node:assert';

import { createCommand, createPlugin, last } from '@seahax/args';
import { main, withTask } from '@seahax/main';

import { loadConfig } from './config.js';
import { withContext } from './context.js';
import { applyResources, type Resource } from './resource.js';
import resourceBucket from './resources/bucket.js';
import resourceCdn from './resources/cdn.js';

const resources: readonly Resource[] = [
  resourceBucket,
  resourceCdn,
];

const pluginConfig = createPlugin((command) => {
  return command.positional('filename', 'Path to a configuration file.');
});

const up = createCommand()
  .usage('spin up [filename]')
  .info('Create or update all application resources.')
  .use(pluginConfig)
  .help()
  .action(async ({ options }) => {
    if (!options) return;

    const { filename } = options;
    const config = await loadConfig(filename);

    console.info(`UP ${config.name}`);
    await withContext(config, async (ctx) => {
      await applyResources('up', ctx, resources);
      await withTask('Cleanup', async () => {
        await applyResources('cleanup', ctx, resources);
      });
    });
  });

const down = createCommand()
  .usage('spin down [filename]')
  .info('Delete all application resources.')
  .use(pluginConfig)
  .action(async ({ options }) => {
    if (!options) return;

    const { filename } = options;
    const config = await loadConfig(filename);

    console.info(`DOWN ${config.name}`);
    await withContext(config, async (ctx) => {
      await applyResources('down', ctx, resources);
      await ctx.app.delete();
    });
  });

const config = createCommand()
  .usage('spin config [filename]')
  .info('Print the configuration.')
  .use(pluginConfig)
  .string('format', {
    info: 'Output format (json or yaml).',
    parse: last((value) => {
      if (!value) return;
      assert(value === 'json' || value === 'yaml', `Invalid format "${value}".`);
      return value;
    }),
  })
  .action(async ({ options }) => {
    if (!options) return;

    const { filename } = options;
    const config = await loadConfig(filename);

    console.log(JSON.stringify(config, null, 2));
  });

await main(async () => {
  await createCommand()
    .usage('spin <command> [options...]')
    .info([
      'Simple, serverless, infrastructure-as-code applications deployed in your own AWS account.',
      'Homepage: https://spindrift.seahax.com',
    ])
    .help()
    .subcommand('up', up)
    .subcommand('down', down)
    .subcommand('config', config)
    .action(async ({ type, command }) => {
      if (type === 'options') {
        command.printHelp();
        throw new Error('Command required.');
      }
    })
    .parse(process.argv.slice(2));
});
