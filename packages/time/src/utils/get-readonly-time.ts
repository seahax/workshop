import { HOUR_AS_MS, MINUTE_AS_MS, SECOND_AS_MS } from '../constants/durations.js';
import { weekdayNames } from '../constants/weekdays.js';
import { type ReadonlyTime } from '../types/readonly-time.js';
import { getPartsFactory } from './get-parts-factory.js';
import { lazy } from './lazy.js';

/**
 * Get basic information about a timestamp. Basic information includes all the
 * numeric "clock" components, as well as the ISO time zone offset string.
 *
 * Caching is used extensively to avoid repeat calculations and extra
 * `Intl.DateTimeFormat` instantiations.
 */
export function getReadonlyTime(timestamp: number, tz: string): ReadonlyTime {
  const getParts = getPartsFactory(`readable|${tz}`, {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false,
    minute: 'numeric',
    second: 'numeric',
    weekday: 'long',
    era: 'short',
    timeZoneName: 'longOffset',
  });

  const getTimestampParts = lazy(() => getParts(timestamp));

  const readable: ReadonlyTime = {
    getTz: () => tz,
    // The timeZoneName (longOffset) returned here will have a GMT prefix
    // (eg. `GMT-08:00`) that the getter should not return.
    getTzOffset: lazy(() => getTimestampParts().timeZoneName!.slice(3)),
    getTzOffsetMs: lazy(() => {
      const offset = readable.getTzOffset();
      const sign = offset.startsWith('-') ? -1 : 1;
      const hours = Number.parseInt(offset.slice(1, 3), 10);
      const minutes = Number.parseInt(offset.slice(4, 6), 10);
      // XXX: The ISO spec allows for optional seconds in the offset.
      const seconds = offset.length > 6 ? Number.parseInt(offset.slice(7, 9), 10) : 0;

      return sign * (hours * HOUR_AS_MS + minutes * MINUTE_AS_MS + seconds * SECOND_AS_MS);
    }),
    getYear: lazy(() => {
      const { year, era } = getTimestampParts();
      const yearNumber = Number.parseInt(year!, 10);

      return era === 'BC' ? -yearNumber + 1 : yearNumber;
    }),
    // The month returned here is 1-based, so convert it to 0-based which is
    // what the getter should return.
    getMonth: lazy(() => Number.parseInt(getTimestampParts().month!, 10)),
    getDay: lazy(() => Number.parseInt(getTimestampParts().day!, 10)),
    // Weirdly, Intl.DateTimeFormat doesn't have a way to get the weekday as
    // a number, so determine the index from the known-weekdays constant.
    getDayOfWeek: lazy(() => weekdayNames.indexOf(getTimestampParts().weekday!)),
    // The hour may be 24, which is the same as 0, which is what the getter
    // should return.
    getHour: lazy(() => Number.parseInt(getTimestampParts().hour!, 10) % 24),
    getMinute: lazy(() => Number.parseInt(getTimestampParts().minute!, 10)),
    getSecond: lazy(() => Number.parseInt(getTimestampParts().second!, 10)),
    // The clock millisecond component is the same in all time zones,
    // because the minimum offset is one second. Getting the millisecond
    // this way also avoids using the fractionalSecondDigits option of
    // Intl.DateTimeFormat, which only became widely supported in 2021.
    getMs: lazy(() => new Date(timestamp).getMilliseconds()),
    toClock: () => ({
      year: readable.getYear(),
      month: readable.getMonth(),
      day: readable.getDay(),
      hour: readable.getHour(),
      minute: readable.getMinute(),
      second: readable.getSecond(),
      ms: readable.getMs(),
    }),
    valueOf: () => timestamp,
  };

  return readable;
}
