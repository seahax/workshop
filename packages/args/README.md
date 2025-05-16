# @seahax/args

Type safe command line argument parsing with [Standard Schemas](https://standardschema.dev/) support.

- [Options](#options)
  - [Named](#named)
  - [Positional](#positional)
  - [Built-in Schemas](#built-in-schemas)
  - [Validate Function Schemas](#validate-function-schemas)
- [Commands](#commands)
- [Help](#help)
- [Create Print Functions](#create-print-functions)
  - [Prevent Paragraph Wrapping](#prevent-paragraph-wrapping)
  - [Reusable Snippets](#reusable-snippets)
  - [Standard Schema Issues](#standard-schema-issues)

## Options

Parse command line arguments given option definitions. The arguments to be parsed must always be passed in explicitly (eg. `process.argv.slice(2)`), and should not include the first two arguments of [process.argv](https://nodejs.org/api/process.html#process_process_argv), which are not part of the command line arguments.

```ts
import { parseOptions, option, flag, negate, alias, count, cue } from '@seahax/args';

const result = await parseOptions(process.argv.slice(2), {
  // When parsed, all parsing stops (before validation) and the cue option name
  // is returned as the parse result value.
  '--help', cue(),

  // Parse a named option that does not accept a value. The result value will
  // be true if the option is present (and not negated), and false otherwise.
  '--flag': flag(),

  // Counts the number of occurrences.
  '--count': count(),

  // Parse a named option that requires a value.
  '--option': option({
    // A Standard Schema (eg. Zod) for parsing and validating the value. If
    // the `multiple` option is true, the schema will be applied to each value.
    // Default: If no schema is provided, values will be strings.
    schema: z.string().email()

    // If true, parsing will fail if the option is not used. Default: false.
    required: false,

    // If true, repeating the option will collect all values into an array,
    // instead of using only the last value. Default: false.
    multiple: false,
  }),

  // Using the alias is the same as using the target option. Only cues, flags,
  // counts, and non-positional options can be aliased.
  '-f': alias('--flag'),

  // Resets the target option to it's initial value, as if if was never used
  // Only flags, counts, and non-positional options can be reset.
  '--no-flag': reset('--flag'),

  // Standard Schemas for parsing positional option values. Each schema is used
  // only once, in order. If there are not enough arguments to match all
  // schemas, the remaining schemas will still be used with an `undefined`
  // input.
  positionals: [
    z.string().optional(),
  ],

  // Parse the rest of the positional option values after matching individual
  // positional options defined in the `positionals` array. The schema will be
  // applied to each value.
  extraPositionals: z.string(),
});
```

The returned result is a Standard Schema `Result` object.

If parsing fails, the result `value` will be undefined, and the `issues` array will contain information about why parsing failed.

```ts
{
  value: undefined,
  issues: [
    {
      message: 'Unknown option "--foo"',
      path: [0],
    },
  ],
}
```

If parsing succeeds, the result `value` will be an object parsed option values, unless a `cue` is matched.

```ts
{
  value: {
    '--flag': true,
    '--count': 2,
    '--option': 'email@example.com',
    positionals: [
      'foo',
      'bar',
    ],
  },
  issues: undefined,
}
```

If a `cue` is matched, the result `value` will be the cue option name.

```ts
{
  value: '--help',
  issues: undefined,
}
```

### Named

Named option names must start with a hyphen (`-`). If an argument with a leading hyphen does not match any defined option names, parsing will fail and the corresponding Standard Schema issue will not have a `path`.

Named options which require values can be parsed from a single argument that includes an equals sign (eg. `--foo=bar`), or from two arguments where the first argument is the option name and the second argument is the value (`--foo bar`).

The double dash (`--`) option is reserved. When a double dash (`--`) argument is parsed, the parser will stop matching named options, and treat all remaining arguments as positional options, even if those that start with a hyphen.

Parsed named option values are available in the result at `value[<option-name>]` where `<option-name>` is the name of the option.

### Positional

Positional options match any argument that is not part of a named option. They are matched in the order they are defined.

Parsed positional values (including `extraPositionals`) are available in the result at `value.positionals` array.

### Built-in Schemas

You can use any Standard Schema compatible library to parse and validate option values. But, this library does provide a few basic schemas for convenience.

- `string(options?)`: Validate a string value.
- `number(options?)`: Validate a number-like value.
- `bigint(options?)`: Validate a bigint-like value.
- `regexp(options?)`: Validate a regular expression-like value.
- `anyOf(schemas, options?)`: Validate a value that matches any of the provided schemas.

```ts
parseOptions(process.argv.slice(2), {
  '--string': string(),
  '--regexp': regexp(),
  '--number': number(),
  '--bigint': bigint(),
  '--number-or-string': anyOf(
    [number(), string()],
    { message: 'Must be a number or string' }
  ),
  positional: [
    string({ optional: true }),
  ],
  extraPositionals: string(),
});
```

The `optional` option defaults to `false`. Setting it to `true` is only useful when validating positional values, where the schema is used to parse an `undefined` value if no argument is provided for that position.

The `message` option allows you to replace the default issue message. The `anyOf` schema will return all sub-schema issues when validation fails, unless the `message` option is provided.

### Validate Function Schemas

A function can also be used as a schema. The function must match the `StandardSchemaV1.Props['validate']` type.

```ts
parseOptions(process.argv.slice(2), {
  '--email': (value) => {
    return isValidEmail(value)
      ? { value }
      : { issues: [{ message: 'Invalid email address' }] };
  }
});
```

## Commands

Match one or more leading arguments against a known set of command names. The arguments must be passed in explicitly and should not include the first two arguments of [process.argv](https://nodejs.org/api/process.html#process_process_argv), which are not part of the command line arguments.

```ts
import { parseCommands } from '@seahax/args';

const result = await parseCommands([
  // Matches the first argument.
  'command',
  // Matches the first two arguments.
  'another command',
]);
```

The returned result is a Standard Schema `SuccessResult` object.

If no command is matched, the result `value.command` will be `undefined`, and the result `value.args` will contain the same arguments that were passed to the parser.

If a command is matched, the result `value.command` will be the command name that was matched (not the individual arguments if a multi-word command is matched), and the result `value.args` will contain the remaining arguments.

## Help

Help text is not generated from option or command definitions. Instead, utilities are provided to make printing custom help text easier and prettier.

## Create Print Functions

Create a help print function, pre-configured with your help text.

```ts
import { createHelp } from '@seahax/args';

const help = createHelp`
{bold Usage:} my-cli {cyan <command>} {blue [options]}

Printed help text can be styled using curly-bracketed style tags, which are
translated into ANSI escape codes using the "chalk-template" library.

Paragraphs (like this one) will be wrapped to fit the terminal width (min 20
and max 80 columns). A paragraph is any unindented block of text, that does not
any multi-whitespace segments, separated from other lines of text by blank
lines. To prevent a paragraph from being wrapped, add a trailing space at the
end. The extra space will be removed, but the paragraph line breaks will be
preserved.

{bold Commands:}
  {cyan help}        Show this help message.
  {cyan version}     Show the version number.
  {cyan run}         Run the command.

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

If you have a lot of help text or multiple commands that share help text, snippets can be defined that are not immediately printed.

```ts
import { createHelpSnippet } from '@seahax/args';

const snippet = createHelpSnippet`
Leading and trailing blank lines are removed from this text, but otherwise this
text is left unchanged. All style tags are preserved, and will be translated
to ANSI codes when the snippet is printed by a (createHelp) help function.
`;
```

Snippets have leading and trailing blank lines removed, but are otherwise unmodified. This makes them simple to use as template values in help text.

```ts
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
Error (argument #1): Unknown option "--foo"
```

Example: A missing option value issue.
```
Error (option "--foo"): Missing option value
```