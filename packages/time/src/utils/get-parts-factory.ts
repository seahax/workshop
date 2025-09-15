interface Config extends Intl.DateTimeFormatOptions {
  readonly timeZone: string;
}

interface Parts {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  second?: string;
  fractionalSecond?: string;
  dayPeriod?: string;
  weekday?: string;
  era?: string;
  timeZoneName?: string;
}

type Factory = (timestamp: number) => Parts;

const cache = new Map<string, Factory>();

/**
 * Use `Intl.DateTimeFormat` to format a timestamp to parts.
 *
 * - The structure is transformed from the entries array returned by
 *   `parseToParts`, to a more useful object map of the parts.
 * - Instances of `Intl.DateTimeFormat` are cached to avoid the cost of
 *   creating them. Convert a timestamp to a map of `Intl.DateTimeFormat`
 *   parts.
 */
export function getPartsFactory(cacheKey: string, config: Config): Factory {
  let factory = cache.get(cacheKey);

  if (!factory) {
    const format = new Intl.DateTimeFormat('en-US', config);
    factory = (timestamp) => getParts(format.formatToParts(timestamp));
    cache.set(cacheKey, factory);
  }

  return factory;
}

function getParts(entries: Intl.DateTimeFormatPart[]): Parts {
  const parts: Parts = {};

  entries.forEach((entry) => {
    switch (entry.type) {
      case 'year':
      case 'month':
      case 'day':
      case 'hour':
      case 'minute':
      case 'second':
      case 'fractionalSecond':
      case 'dayPeriod':
      case 'weekday':
      case 'era':
      case 'timeZoneName': {
        parts[entry.type] = entry.value;
        break;
      }
      // intentionally ignored
      case 'literal':
      case 'unknown': {
        break;
      }
    }
  });

  return parts;
}
