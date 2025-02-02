import { createCommand } from '@seahax/args';
import { main } from '@seahax/main';

await main(async () => {
  await createCommand()
    .usage('neverhaven [options]')
    .info('A text-based fantasy adventure game!')
    .action(async (result) => {
      if (result.type !== 'options') return;

      console.log('Welcome to Neverhaven!');
    })
    .parse(process.argv.slice(2));
});
