import { main } from '@seahax/main';

import { getAccountId } from './account.js';
import commandConfig from './commands/config.js';
import commandDown from './commands/down.js';
import commandLogs from './commands/logs.js';
import commandUp from './commands/up.js';
import { resolveConfig } from './config.js';
import { getCredentials } from './credentials.js';
import { type ResolvedConfig } from './types/config.js';
import { assert } from './utils/assert.js';
import { spinner } from './utils/spinner.js';

main.events.on('beforeLog', () => {
  spinner.clear();
});

await main(async () => {
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
      await assertAccount(config.aws);
      return await commandUp(config);
    }
    case 'down': {
      spinner.prefixText = 'DOWN';
      await assertAccount(config.aws);
      return await commandDown(config);
    }
    case 'logs': {
      await assertAccount(config.aws);
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

async function assertAccount({
  accounts,
  profile,
}: Pick<ResolvedConfig['aws'], 'accounts' | 'profile'>): Promise<void> {
  if (accounts.length === 0) return;

  const credentials = getCredentials({ profile });
  const accountId = await getAccountId({ credentials });

  assert(
    accounts.includes(accountId),
    `AWS account ID "${accountId}" is not allowed by the configuration.`,
  );
}

function usageError(message: string): void {
  printUsage('stderr');
  process.stderr.write('\n');
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

function printUsage(target: 'stderr' | 'stdout' = 'stdout'): void {
  spinner.clear();
  process[target].write('Usage: engage up|down|logs|config [filename]\n');
  process[target].write('       engage help|-h|--help\n');
}
