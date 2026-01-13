# @seahax/cli

Small quality-of-life enhancements to the Node built-in `utils/parseArgs` utility, and a simple command/sub-command framework.

Adds the following features:
- Slightly improved types.
- Required positional arguments.
- Commands and subcommands.
- Main module detection.
- Help option matching.

Additionally, the following config parameters have been removed:
- `strict`: Always true, which simplifies typing.
- `options.*.default`: Unnecessary. Use destructuring with default values or nullish coalescing instead.

## Quick Start

```ts
import { main, parseArgs, command, subcommands, help } from '@seahax/cli';

const rootCommand = await command()
```

## Improved Types

The `parseArgs(config)` parameters should auto-complete and show intellisense descriptions.

Parsed options with the `multiple` parameter set to `true` are inferred as `undefined | [string, ...string[]]`, so that the first element is guaranteed to exist if the value is defined. If an option was not used, then its parsed value will be `undefined` rather than an empty array.

## Required Positional Arguments

The config object accepts a `positionals` array of required positional argument names. The returned result will have a `positionals` property with an array of positional value strings that is at least as long as the `positionals` array, and may be longer if the `allowExtraPositionals` config parameter is set to `true`.

```ts
const { positionals } = parseArgs({
  args: process.argv.slice(2),
  positionals: ['required1', 'required2'],
  allowExtraPositionals: true,
});
```

In the above example, `positionals` will be of type `[string, string, ...string[]]`, which means the array `length` is guaranteed to be at least 2.

If `args` does not contain enough positional arguments, an error will be thrown.

## Commands

A `command` utility function is provided to help create command functions that follow the following contract.

- A command accepts and parses an optional array of command line argument strings.
- A command exits the process when complete.
- The promise returned by a command never resolves.
- If no argument array is provided to the command, `process.argv.slice(2)` is used.
- If an error is thrown by the command...
  - It is printed to the terminal.
  - If the error is an `Error` instance, just print the message.
  - The process exits with a non-zero code.

```ts
const myCommand = await command(import.meta, async (args) => {
  // Your command logic here...
});

await myCommand();

// Code below the above call will never be executed because the process
// will exit and the returned promise will never resolve.
```

### ...And Subcommands

Subcommands are named commands that are executed when the first argument matches the subcommand name. A `subcommands` utility function is provided to implement this behavior.

If a subcommand is matched, the associated command function is executed with the remaining arguments (excluding the subcommand name). The matched subcommand is expected to exit the process when complete (like all commands). The promise returned by the `subcommands` function will never resolve in this case.

If the `args` array is empty or if the first argument is option-like (ie. starts with a dash), then the `subcommands` function will return without executing any subcommands.

If no subcommand is matched, but the first argument is present and not option-like (positional), then an error is thrown.

```ts
const myCommand = await command(async (args) => {
  await subcommands({
    args,
    commands: {
      'my-subcommand': command(async (args) => {
        // Your subcommand logic here...
      }),
    },
  });
 
  // Your default or missing command logic here...
});
```

## Main Module Detection

To run a command only if the current module is the main module, use the `main` utility function. The first argument can be the ESM `import.meta` object or the CommonJS `module` object.

If the module represented by `import.meta` or `module` is the main module, then the provided command is executed. The command is expected to exit the process when complete (like all commands). The promise returned by the `main` function will never resolve in this case.

```ts
import { main } from '@seahax/cli';

await main(import.meta, myCommand, {
  // The following option value is the default.
  args: process.argv.slice(2),
});
```

## Help Option Matching

This package does not auto-generate help text, but it does include a `help` utility function that prints your own help text when a help option is used.

Help options are only matched before the first positional argument. This makes it safe to use the `help` function before handling subcommands.

The help text is left (start) trimmed before printing. All other whitespace is preserved. This is to allow multiline strings to be defined with an initial newline (following the opening backtick) for better readability.

The `help` function will exit the process after printing the help text if a help option is matched. The promise returned by the `help` function will never resolve in this case.

```ts
// A help text string defined by you.
const HELP_TEXT = `
Usage: my-command [options] <args>

This is my command description.

Options:
  -f, --foo    Description for foo option
  -h, --help   Show this help message
`;

await command(import.meta, async (args) => {
  await help(HELP_TEXT, {
    args,
    // The following option values are the defaults.
    optionNames: ['h', 'help'],
    writeStream: process.stdout,
  });

  // If the returned promise resolves, it means no help option was used;
  // continue with normal command logic like parsing args and/or running
  // subcommands...
});
```

The `help` function can also be used to print other messages based on other option names. For example, you could use it to print version information when the `--version` option is used.

```ts
await help(VERSION, { optionNames: ['version'] });
```