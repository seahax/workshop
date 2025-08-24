import { describe, expect, test } from 'vitest';

import { interval } from './index.ts';

describe('interval', () => {
  ([
    ['123ms', 'ms', 123],
    ['2s', 's', 2],
    ['3m', 'm', 3],
    ['4h', 'h', 4],
    ['5d', 'd', 5],
    ['1 minute', 's', 60],
    ['1 hour', 'm', 60],
    ['1 day', 'h', 24],
    ['1 day', 'm', 1440],
    ['1 day', 's', 86400],
    ['-500ms', 'ms', -500],
    ['+2h', 'm', 120],
    ['1.5h', 'm', 90],
    ['1e3ms', 's', 1],
  ] as const).forEach(([template, unit, expected]) => {
    test(`interval('${template}').as('${unit}') === ${expected}`, () => {
      expect(interval(template).as(unit)).toBe(expected);
    });
  });
});
