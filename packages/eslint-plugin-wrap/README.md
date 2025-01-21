# @seahax/eslint-plugin-wrap

Wrapping fixes for long lines.

This plugin is meant as a companion to the [@stylistic/max-len](https://eslint.style/rules/js/max-len) rule, which does not provide fixes for long lines. It works well when ESLint is used as the formatter (ie. when not using Prettier).

This is not designed to fix _all_ lines that exceed a maximum length; Only those where there is a simple and generally accepted fix. This is to avoid Prettier-like over formatting, and interfering with manual formatting.

Principals:
- Only wrap when a line is too long.
- Only wrap single line statements (not already wrapped).
- Never unwrap.

Table of Contents:
- [Getting Started](#getting-started)
- [Options](#options)
- [Rules](#rules)
  - [`@seahax/wrap/import`](#seahaxwrapimport)
  - [`@seahax/wrap/function`](#seahaxwrapfunction)
  - [`@seahax/wrap/object`](#seahaxwrapobject)
  - [`@seahax/wrap/array`](#seahaxwraparray)
  - [`@seahax/wrap/ternary`](#seahaxwrapternary)
  - [`@seahax/wrap/union`](#seahaxwrapunion)

## Getting Started

```js
// eslint.config.js
import wrap from '@seahax/eslint-plugin-wrap';

export default [
  wrap.config({
    // The following options are the default values.
    maxLen: 80,
    tabWidth: 4,
    autoFix: true
  }),
  // ...other ESLint config items.
];
```

The `wrap.config()` helper generates a config that includes all [rules](#rules) as warnings.

## Options

- `"maxLen": <number>`
  - The maximum desired line length. Wrapping will be recommended on lines that exceed this length. Should be less than or equal to the `@stylistic/max-len` config.
  - Default: `80`
- `"tabWidth": <number> | "tab"`
  - The width of a tab (single level of indent) in spaces. This is used to add correct indentation when wrapping lines.
  - Default: `4`
- `"autoFix": <boolean>`
  - If `false`, fixes are provided as suggestions. This prevents fixes from being automatically applied when the ESLint CLI `--fix` option is used, and when using ESLint as a VSCode formatter.
  - Default: `true`

Example: Set options for a single rule.

```json
{
  "rules": {
    "@seahax/wrap/import": ["warn", { "maxLen": 80, "tabWidth": 4, "autoFix": true }]
  }
}
```

Example: Override default option values.

```json
{
  "settings": {
    "@seahax/wrap": { "maxLen": 80, "tabWidth": 4, "autoFix": true }
  }
}
```

## Rules

### `@seahax/wrap/import`

Wrap named imports if the import is a single line, and it exceeds the
max line length.

Before:
```ts
import defaultExport, { foo, bar, baz } from 'some-package';
```

After:
```ts
import defaultExport, {
  foo,
  bar,
  baz,
} from 'some-package';
```

### `@seahax/wrap/function`

Wrap function args if the function header is a single line, and it exceeds the max line length. If the function accepts a single destructured object argument (params), then the destructured properties will be wrapped instead of the argument.

Before:
```ts
function withArgs(foo: string, bar: string, baz: string): void {
  ...
}

function withParams({ foo, bar, baz }: Params): void {
  ...
}
```

After:
```ts
function withArgs(
  foo: string,
  bar: string,
  baz: string,
): void {
  ...
}

function withParams({
  foo,
  bar,
  baz,
}: Params): void {
  ...
}
```

### `@seahax/wrap/object`

Wrap object properties if the object is one line, and it exceeds the max line length.

Before:
```ts
const object = { foo: 1, bar: 2, ...otherProps };
```

After:
```ts
const object = {
  foo: 1,
  bar: 2,
  ...otherProps,
};
```

### `@seahax/wrap/array`

Wrap array elements if the array is one line, and it exceeds the max line length.

Before:
```ts
const array = [1, 2, 3];
```

After:
```ts
const array = [
  1,
  2,
  3,
];
```

### `@seahax/wrap/ternary`

Wrap a ternary expression if it is one line, and it exceeds the max line length.

Before:
```ts
const result = condition ? ifTrue : ifFalse;
```

After:
```ts
const result = condition
  ? ifTrue
  : ifFalse;
```

### `@seahax/wrap/union`

Wrap union types if the union is one line, and it exceeds the max line length.

Before:
```ts
type MyType = Foo | Bar | Baz;
```

After:
```ts
type MyType =
  | Foo
  | Bar
  | Baz;
```
