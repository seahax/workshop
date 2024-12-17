import { main, registerBeforeLogHandler } from '@seahax/main';

import commandConfig from './commands/config.js';
import commandDown from './commands/down.js';
import commandLogs from './commands/logs.js';
import commandUp from './commands/up.js';
import { resolveConfig } from './config.js';
import { Context } from './context.js';
import { type ResolvedConfig } from './types/config.js';
import { assert } from './utils/assert.js';
import { spinner } from './utils/spinner.js';

registerBeforeLogHandler(() => {
  spinner.clear();
});

main(async () => {
  const [command, filename] = process.argv.slice(2);

  if (command === 'help' || command === '-h' || command === '--help') {
    printUsage();
    return;
  }

  const config = await resolveConfig(filename);

  switch (command) {
    case undefined: {
      return usageError('Command required.');
    }
    case 'up': {
      await assertAccount(config);
      return await commandUp(config);
    }
    case 'down': {
      spinner.prefixText = 'DOWN';
      await assertAccount(config);
      return await commandDown(config);
    }
    case 'logs': {
      await assertAccount(config);
      return await commandLogs(config);
    }
    case 'config': {
      return await commandConfig(config);
    }
    default: {
      return usageError(`Unknown command "${command}".`);
    }
  }
});

async function assertAccount({ app, aws }: Pick<ResolvedConfig, 'app' | 'aws'>): Promise<void> {
  const { accounts, region, profile } = aws;

  if (accounts.length === 0) return;

  const ctx = new Context({ app, region, profile });
  const accountId = await ctx.getAccountId();

  assert(
    accounts.includes(accountId),
    `AWS account ID "${accountId}" is not allowed by the configuration.`,
  );
}

function usageError(message: string): void {
  printUsage();
  console.log();
  console.error(message);
  process.exitCode = 1;
}

function printUsage(): void {
  console.log('Usage: engage up|down|logs|config [filename]');
  console.log('       engage help|-h|--help');
}
