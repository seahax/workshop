import { type JSONSchema4 } from '@typescript-eslint/utils/json-schema';
import { type RuleContext } from '@typescript-eslint/utils/ts-eslint';

import { NAMESPACE } from './constants/namespace.js';

export interface Options {
  /**
   * The maximum desired line length. Wrapping will be recommended on lines
   * that exceed this length.
   *
   * Default: `80`
   */
  readonly maxLen?: number;

  /**
   * The width of a tab character in spaces. Or more generally, the number of
   * spaces in a single level of indentation. This is used to add correct
   * indentation when wrapping lines.
   *
   * Default: `4`
   */
  readonly tabWidth?: number;

  /**
   * If `false`, fixes are provided as suggestions. This prevents fixes from
   * being automatically applied when the ESLint CLI `--fix` option is used,
   * and when using ESLint as a VSCode formatter.
   *
   * Default: `true`
   */
  readonly autoFix?: boolean;
}

export const OPTIONS_SCHEMA = {
  type: 'object',
  properties: {
    maxLen: {
      type: 'integer',
      minimum: 0,
    },
    tabWidth: {
      type: 'integer',
      minimum: 0,
    },
    autoFix: {
      type: 'boolean',
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema4;

export function getOptions(context: Readonly<RuleContext<string, [Options?]>>): Required<Options> {
  const settings = context.settings[NAMESPACE] as Options | undefined;

  return {
    maxLen: context.options[0]?.maxLen ?? settings?.maxLen ?? 80,
    tabWidth: context.options[0]?.tabWidth ?? settings?.tabWidth ?? 4,
    autoFix: context.options[0]?.autoFix ?? settings?.autoFix ?? true,
  };
}
