/* eslint-disable unicorn/no-process-exit */

export interface HelpOptions {
  /**
   * Array of argument strings.
   *
   * @default process.argv.slice(2)
   */
  readonly args?: readonly string[];

  /**
   * Help option names to match (without leading dashes).
   *
   * @default ['help','h']
   */
  readonly optionNames?: readonly string[];

  /**
   * Stream where the help text will be written.
   *
   * @default process.stdout
   */
  readonly writeStream?: NodeJS.WriteStream;
}

export async function help(text: string, {
  args = process.argv.slice(2),
  optionNames = ['help', 'h'],
  writeStream = process.stdout,
}: HelpOptions = {}): Promise<void> {
  const flags = new Set(optionNames.map((name) => {
    return name.startsWith('-') ? name : (name.length === 1 ? `-${name}` : `--${name}`);
  }));

  const arg = args.find((arg) => {
    return arg === '--' || !arg.startsWith('-') || flags.has(arg);
  });

  if (arg == null || arg === '--' || !arg.startsWith('-')) {
    // Help flag not found.
    return;
  }

  writeStream.write(text.trimStart() + '\n');
  process.exit();
};
