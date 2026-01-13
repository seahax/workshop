/* eslint-disable unicorn/no-process-exit */

export type Command = (args?: string[]) => Promise<never>;
export type CommandHandler = (args: string[]) => Promise<void> | void;

export function command(handler: (args: string[]) => Promise<void> | void): Command {
  return async (args = process.argv.slice(2)) => {
    try {
      await handler(args);
    }
    catch (error) {
      process.exitCode ||= 1;
      console.error(error instanceof Error ? error.message : String(error));
    }

    return process.exit();
  };
}
