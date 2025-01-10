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

await main(async () => {
  const [command, filename] = process.argv.slice(2);

  if (command === 'help' || command === '-h' || command === '--help') {
    printUsage();
    return;
  }

  const config = await loadConfig(filename);

  switch (command) {
    case undefined: {
      return usageError('Command required.');
    }
    case 'up': {
      console.info(`UP ${config.name}`);
      await withContext(config, async (ctx) => {
        await applyResources('up', ctx, resources);
        await withTask('Cleanup', async () => {
          await applyResources('cleanup', ctx, resources);
        });
      });
      break;
    }
    case 'down': {
      console.info(`DOWN ${config.name}`);
      await withContext(config, async (ctx) => {
        await applyResources('down', ctx, resources);
        await ctx.app.delete();
      });
      break;
    }
    case 'config': {
      console.log(JSON.stringify(config, null, 2));
      break;
    }
    // case 'logs': {
    //   await assertAccount(config.aws);
    //   return await commandLogs(config);
    // }
    default: {
      return usageError(`Unknown command "${command}".`);
    }
  }
});

function usageError(message: string): void {
  printUsage('stderr');
  process.stderr.write('\n');
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function printUsage(target: 'stderr' | 'stdout' = 'stdout'): void {
  process[target].write('Usage: spin up|down|logs|config [filename]\n');
  process[target].write('       spin help|-h|--help\n');
}
