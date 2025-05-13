# @seahax/args

Type safe command line argument parsing with [Standard Schemas](https://standardschema.dev/) support.

- [Options](#options)
  - [Flags](#flags)
  - [Counts](#counts)
  - [Aliases](#aliases)
  - [Cues](#cues)
  - [Unknown Options](#unknown-options)
  - [Short and Long Options](#short-and-long-options)
  - [Values for Options](#values-for-options)
  - [Positional Values](#positional-values)
  - [Extra Arguments](#extra-arguments)
- [Commands](#commands)
  - [Subcommands](#subcommands)
- [Parse Callbacks](#parse-callbacks)
- [Help](#help)
- [Create Print Functions](#create-print-functions)
  - [Prevent Paragraph Wrapping](#prevent-paragraph-wrapping)
  - [Reusable Snippets](#reusable-snippets)
  - [Standard Schema Issues](#standard-schema-issues)

## Options

Use the built-in `option` schema, or any Standard Schema compatible library (eg. [Zod](https://zod.dev)) to define options.

```ts
import { createOptions, option } from '@seahax/args';
import { z } from 'zod'; // Zod is standard schema compatible.

const options = createOptions({
  // Optional emails. Keep the last one.
  '--email': z.string().email().array().transform((emails) => emails.at(-1)),
  // Required numbers. Keep all.
  '--numbers': z.number({ coerce: true }).array().nonempty(),
  // Positional strings: Keep all.
  positional: option({ required: false, multiple: true }),
});
```

> NOTE: When using Standard Schemas, the schema input is always an array of strings. If an option is not used, the option schema is still invoked with an empty array, so that it can enforce a required option or provide a default value.

Use the options instance to parse command line arguments. Arguments must be passed in explicitly and should not include the first two arguments of [process.argv](https://nodejs.org/api/process.html#process_process_argv), which are not part of the command line arguments.

```ts
const result = await options.parse(process.argv.slice(2));
```

Alternatively, you can use the `parseOptions(args, config, callback?)` function as a shorthand for `createOptions(config).parse(args, callback?)`.

Consume the parsed result, which is a Standard Schema `Result` object.

```ts
if (result.issues) {
  result.issues.forEach((issues) => console.error(issues));
  process.exit(1);
} else {
  console.log('Email:', result.value['--email']);
  console.log('Numbers:', result.value['--numbers']);
  console.log('Positional:', result.value.positional);
}
```

The defined options instance is itself a Standard Schema, and the `parse` return value is a Standard Schema `Result` object.

### Flags

Flags are boolean or counter options that do not take a value. The result value is `true` if the flag is present and not negated, and `false` if the flag is not present or is negated.

```ts
import { flag, negate } from '@seahax/args';

createOptions({
  // True if present.
  '--condition': flag(),
  // Reset the --condition option to false.
  '--not-condition': negate('--flag'),
});
```

### Counts

Counts are flags that count the number of times they are used. The count is always a number, and the default value is `0`. The count can be negative if the option is negated.

```ts
import { count } from '@seahax/args';

createOptions({
  // Counts the number of uses.
  '--increment': count(),
});
```

### Aliases

Alias one option to another. An alias works exactly like the original option. The alias name is not added to the parsed result value.

```ts
import { alias } from '@seahax/args';

createOptions({
  '--foo': flag(),
  // Alias -f to --foo.
  '-f': alias('--foo'),
});
```

### Cues

Cues are used to short circuit parsing. When a cue option is parsed, parsing immediately stops and the cue value is returned.

```ts
import { cue } from '@seahax/args';

const options = createOptions({
  '--help': cue('help'),
});

const { value } = await options.parse(['--help']);
// value = 'help'
```

### Unknown Options

Any argument that starts with a hyphen (`-`) is considered an option name. If it does not match any defined option names, parsing will fai. The Standard Schema issue will not have a `path`.

If option-like arguments must be treated as positional values, use the `--` separator argument to tell the parser to stop parsing options and treat all remaining arguments as positional arguments.

### Short and Long Options

There is no functional difference between options with a single leading hyphen (`-a`) and options with two (or more) leading hyphens (`--abc`). A single hyphen option can have a multi-character suffix (`-abc`), and a double hyphen option can have a single character suffix (`--a`). The parser matches them literally and recognizes any argument that starts with at least one hyphen as an option name.

### Values for Options

Options that accept a value (non-flags) can be parsed from a single argument that includes equals sign (`--foo=bar`), or from two arguments where the first argument is the option name and the second argument is the value (`--foo bar`).

If the option accepts a value, but no value is provided, parsing will fail. The Standard Schema issue `path` will include the option name as the first element.

### Positional Values

Arguments which do not start with a hyphen (`-`) and are not used as option values, are parsed as positional values which must match the special `positional` option schema.

```ts
createOptions({
  // Require between 1 and 3 positional values.
  positional: z.string().array().min(1).max(3),
});
```

### Extra Arguments

Any argument that does not match an option name, an option value, or a positional argument, will cause parsing to fail.

## Commands


Define commands.

```ts
import { createCommands } from '@seahax/args';

const commands = createCommands([
  'my-command',
  'another-command',
]);
```

Use the commands instance to parse command line arguments. Arguments must be passed in explicitly and should not include the first two arguments of [process.argv](https://nodejs.org/api/process.html#process_process_argv), which are not part of the command line arguments.

```ts
const { value } = await commands.parse(['my-command', '--foo', 'bar']);
// value = { command: 'my-command', args: ['--foo', 'bar'] }
```

Alternatively, you can use the `parseCommands(args, config, callback?)` function as a shorthand for `createCommands(config).parse(args, callback?)`.

Command parsing matches the first argument against a list of known commands. If a command is matched, then a success result is returned with the command name that was matched and an array of the remaining arguments. If no command is matched, parsing will still succeed, but the result value `command` property will be `undefined`, and the result value `args` property will contain the same arguments that were passed to the parser.

Consume the parsed result, which is a Standard Schema `SuccessResult` object.

```ts
if (value.command === 'my-command') {
  // Example: Parse the leftover arguments as command options.
  const result = options.parse(value.args);

  // Do command stuff...
}
```

### Subcommands

Subcommands can be defined by space separating words in a command name. Each word will match one argument.

```ts
const commands = createCommands([
  'list images',
  'list containers',
]);

const { value } = await commands.parse(['list', 'images', '--foo', 'bar']);
// value = { command: 'list images', args: ['--foo', 'bar'] }
```

## Parse Callbacks

The `.parse()` method (for both options and commands) accepts a callback as a second argument. The callback is passed the parsed result, and the callback return value is returned from the parse method (replacing the normally returned result).

```ts
const options = createOptions({ ... });
const value = await options.parse(
  process.argv.slice(2),
  (result) => result.issues ?? result.value,
);
```

## Help

Help text is not generated from option or command definitions. Instead, utilities are provided to make printing custom help text easier and prettier.

## Create Print Functions

Create a help print function, pre-configured with your help text.

```ts
import { createHelp } from '@seahax/args';

const help = createHelp`
{bold Usage:} my-cli {green <command>} {blue [options]}

Printed help text can be styled using curly-bracketed style tags, which are
translated into ANSI escape codes using the "chalk-template" library.

Paragraphs (like this one) will be wrapped to fit the terminal width (min 20
and max 80 columns). A paragraph is any unindented block of text, that does not
any multi-whitespace segments, separated from other lines of text by blank
lines. To prevent a paragraph from being wrapped, add a trailing space at the
end. The extra space will be removed, but the paragraph line breaks will be
preserved.

{bold Commands:}
  {green help}        Show this help message.
  {green version}     Show the version number.
  {green run}         Run the command.

{bold Options:}
  {blue --help}      Show this help message.
  {blue --version}   Show the version number.
`;
```

Then, use the returned print function to print your help text as needed.

```ts
// Print the above help text.
help();
// Print the above help text to STDERR.
help.toStderr();
```

You can also append additional text when printing.

```ts
help`Extra text appended to the help text.`;
help.toStderr`Extra text appended to the help text.`;
```

### Prevent Paragraph Wrapping

If you don't want a paragraph to be wrapped, then either indent it, or add a trailing space at the end of the paragraph.

### Reusable Snippets

If you have a lot of help text or multiple commands that share help text, it might be useful to define parts of the help text without immediately printing it.

```ts
import { createHelpSnippet } from '@seahax/args';

const snippet = createHelpSnippet`
Leading and trailing blank lines are removed from this text, but otherwise this
text is left unchanged. All style tags are preserved, and will be translated
to ANSI codes when the snippet is printed by a (createHelp) help function.
`;

const help = createHelp`
Just use the snippet as a template value to included it in printed help text.

${snippet}
`;
```

### Standard Schema Issues

Passing standard schema issues to any of the help functions will stringify them to an error-like human readable format. If an array of issues is used, the printed issues will be separated by newlines.

```ts
const help = createHelp`...`;

help`${issue}`;
help.toStderr`${issue}`;
```

Example: An unknown option issue.
```
Error: Unknown option "--foo"
```

Example: A missing option value issue.
```
Error (--foo): Missing option value
```

Example: An option validation issue.
```
Error (--foo, <issue-path...>): <issue-message>
```