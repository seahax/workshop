import { expect, test, vi } from 'vitest';

import { createCommand } from './command.js';
import { multiple, required } from './utils.js';

test('command', async () => {
  const command = createCommand()
    .usage('my-command [options]')
    .info('Information about this command.')
    .boolean('myBool', 'A boolean option.')
    .string('string', 'A string option.')
    .string('stringWithFlags', { flags: ['--foo', '-f'], info: 'An option with custom flags.' })
    .positional('myPositional', 'A positional option.')
    .variadic('variadic', 'A variadic option.');

  const helpText = command.getHelp();

  expect(helpText).toMatchInlineSnapshot(`
    "Usage: my-command [options]

    Information about this command.

    Options:
      --my-bool          A boolean option.
      --string <value>   A string option.
      --foo, -f <value>  An option with custom flags.
      <my-positional>    A positional option.
      <variadic...>      A variadic option.
    "
  `);

  const result = await command.parse([
    '--my-bool', '--string', 'value', '--foo', 'foo', 'positional', 'variadic1', 'variadic2',
  ]);

  expect(result.options).toMatchInlineSnapshot(`
    {
      "myBool": true,
      "myPositional": "positional",
      "string": "value",
      "stringWithFlags": "foo",
      "variadic": [
        "variadic1",
        "variadic2",
      ],
    }
  `);
});

test('unknown option', async () => {
  const command = createCommand()
    .boolean('str');

  await expect(async () => {
    await command.parse(['--str', '--unknown']);
  }).rejects.toThrowError('Unknown option "--unknown".');
});

test('repeat options', async () => {
  const result = await createCommand()
    .string('multi', { parse: multiple() })
    .string('last')
    .parse(['--multi', 'a', '--multi', 'b', '--last', 'a', '--last', 'b']);

  expect(result.options).toMatchInlineSnapshot(`
    {
      "last": "b",
      "multi": [
        "a",
        "b",
      ],
    }
  `);
});

test('help', async () => {
  const writeSpy = vi.spyOn(process.stdout, 'write').mockReset();
  const command = createCommand()
    .string('str', { parse: required() })
    .help();

  await command.parse(['--help']);
  expect(writeSpy).toHaveBeenCalledOnce();
  expect(writeSpy.mock.calls[0]?.[0]).toMatchInlineSnapshot(`
    "Options:
      --str <value>  

    "
  `);

  writeSpy.mockClear();
  expect(writeSpy).not.toHaveBeenCalled();
  await command.parse(['-h']);
  expect(writeSpy).toHaveBeenCalledOnce();

  writeSpy.mockClear();
  expect(writeSpy).not.toHaveBeenCalled();
  await command.parse(['--str', 'value', '-h']);
  expect(writeSpy).toHaveBeenCalledOnce();
});

test('version', async () => {
  const logSpy = vi.spyOn(console, 'log').mockReset();
  const command = createCommand()
    .version('1.0.0');

  await command.parse(['--version']);
  expect(logSpy).toHaveBeenCalledOnce();
  expect(logSpy.mock.calls[0]?.[0]).toMatchInlineSnapshot(`"1.0.0"`);
});

test('inline option value', async () => {
  const result = await createCommand()
    .string('a')
    .string('b', { flags: ['-b'] })
    .parse(['--a=abc', '-bdef']);

  expect(result.options).toMatchInlineSnapshot(`
    {
      "a": "abc",
      "b": "def",
    }
  `);
});

test('required', async () => {
  const command = createCommand()
    .string('str', { parse: required() });

  await expect(command.parse([])).rejects.toThrowError('Missing "--str <value>".');
  await expect(command.parse(['--str', 'value'])).resolves.not.toThrow();
});

test('required multiple', async () => {
  const command = createCommand()
    .string('str', { parse: required(multiple()) });

  await expect(command.parse([])).rejects.toThrowError('Missing "--str <value>".');
  await expect(command.parse(['--str', 'a'])).resolves.not.toThrow();
  await expect(command.parse(['--str', 'a', '--str', 'b']).then((result) => result.options))
    .resolves.toMatchInlineSnapshot(`
    {
      "str": [
        "a",
        "b",
      ],
    }
  `);
});

test('actions', async () => {
  const commands: any[] = [];
  const inner = createCommand()
    .action(async (result) => void commands.push(result.command));
  const outer = createCommand()
    .subcommand('inner', inner)
    .action(async (result) => void commands.push(result.command));

  const result = await outer.parse(['inner']);

  expect('string' in result.command).toBe(false);
  expect(commands.length).toBe(2);
  expect(commands[0]).toBe(outer);
  expect(commands[1]).toBe(inner);
});

test('flag conflict error', async () => {
  const command = createCommand()
    .boolean('a', ['-a'])
    .boolean('b', ['-a']);

  await expect(command.parse([])).rejects.toThrowError('Duplicate flag "-a".');
  expect(() => command.getHelp()).toThrowError('Duplicate flag "-a".');
  expect(() => command.action(async () => undefined)).toThrowError('Duplicate flag "-a".');
});

test('multiple variadic error', async () => {
  const command = createCommand()
    .variadic('a')
    .variadic('b');

  await expect(command.parse([])).rejects.toThrowError('Only one variadic option is allowed.');
  expect(() => command.getHelp()).toThrowError('Only one variadic option is allowed.');
  expect(() => command.action(async () => undefined)).toThrowError('Only one variadic option is allowed.');
});
