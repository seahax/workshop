export type IntervalUnit = keyof typeof UNITS;
export type IntervalTemplate = (
  | (`${'-' | '+' | ''}${number}${'' | ' '}${IntervalUnit}` & {})
  | number
  | [number, IntervalUnit]
);

export interface Interval {
  as(unit: IntervalUnit, mode?: 'exact' | 'floor' | 'round' | 'trunc'): number;
  valueOf(): number;
}

const UNITS = {
  ms: 1,
  millisecond: 1,
  milliseconds: 1,
  s: 1000,
  second: 1000,
  seconds: 1000,
  m: 60_000,
  minute: 60_000,
  minutes: 60_000,
  h: 3_600_000,
  hour: 3_600_000,
  hours: 3_600_000,
  d: 86_400_000,
  day: 86_400_000,
  days: 86_400_000,
} as const;

const UNIT_NAMES = Object.keys(UNITS).sort().toReversed() as readonly IntervalUnit[];
const UNIT_NAMES_REGEXP = new RegExp(UNIT_NAMES.join('|') + '$', 'u');

export function interval(...templates: [IntervalTemplate, ...IntervalTemplate[]]): Interval {
  let milliseconds = 0;

  for (const template of templates) {
    if (typeof template === 'number') {
      milliseconds += template;
      continue;
    }

    if (Array.isArray(template)) {
      const [value, unit] = template;
      milliseconds += value * UNITS[unit];
      continue;
    }

    const unit = template.match(UNIT_NAMES_REGEXP)?.[0] as IntervalUnit | undefined;
    if (!unit) throw new TypeError(`Invalid interval unit in template: ${template}`);
    const value = Number(template.slice(0, -unit.length));
    if (Number.isNaN(value)) throw new TypeError(`Invalid interval value in template: ${template}`);
    milliseconds += value * UNITS[unit];
  }

  return {
    as(unit, mode = 'exact') {
      const value = milliseconds / UNITS[unit];
      return mode === 'exact' ? value : Math[mode](value);
    },
    valueOf() {
      return milliseconds;
    },
  };
}
