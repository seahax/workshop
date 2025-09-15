import { type Clock } from './clock.js';

/**
 * Immutable instant in time, associated with a time zone.
 */
export interface Time {
  // Getters

  /**
   * Year.
   */
  getYear(): number;
  /**
   * **One-based** (1-12, 1 = January).
   */
  getMonth(): number;
  /**
   * Day of the month (1-31).
   */
  getDay(): number;
  /**
   * **Zero-based** day of the week (0-6, 0 = Sunday).
   */
  getDayOfWeek(): number;
  /**
   * Hour of the day (0-23).
   */
  getHour(): number;
  /**
   * Minute of the hour (0-59).
   */
  getMinute(): number;
  /**
   * Second of the minute (0-59).
   *
   * **NOTE:** Like most languages, JS ignores leap seconds, so the second
   * will never be `60`. This also means that if you subtract a `Date` in
   * 1970 from from one in 2024, it will calculate an elapsed time that is
   * about 37 seconds off. But, because almost no language/system accounts
   * for leap seconds, so things like database records and times generated in
   * non-JS systems will still agree.
   */
  getSecond(): number;
  /**
   * Millisecond of the second (0-999).
   */
  getMs(): number;
  /**
   * IANA time zone identifier (eg. `America/Los_Angeles`).
   */
  getTz(): string;
  /**
   * Offset from GMT/UTC in an ISO 8601 compatible format (eg. `-07:00`)
   */
  getTzOffset(): string;
  /**
   * Time zone offset in milliseconds.
   */
  getTzOffsetMs(): number;
  /**
   * Get a `ClockDict` suitable for passing to the `time()` factory.
   */
  toClock(): Clock;
  /**
   * Number of milliseconds since the Unix epoch (aka: timestamp).
   */
  valueOf(): number;

  // Setters

  /**
   * Set the IANA time zone identifier (eg. `America/Los_Angeles`), _without_
   * changing the Unix offset (ie. `valueOf()` will return the same number of
   * milliseconds before and after the time zone is set).
   */
  setTz(tz: string): Time;
  /**
   * Return a new `Time` with the updated year. Fractional numbers are
   * truncated.
   *
   * **NOTE:** Feb 29th in a leap year may become Feb 28th of the target year
   * if it is not a leap year.
   */
  setYear(year: number): Time;
  /**
   * Return a new `Time` with the updated **one-based** (1 = January) month
   * of the year. Values outside of 1-12 will rollover to the year.
   * Fractional numbers are truncated.
   *
   * **NOTE:** The day may be reduced (constrained) to the last day of the
   * target month if the initial day of the month does not exist in the
   * target month.
   */
  setMonth(month: number): Time;
  /**
   * Return a new `Time` with the updated day of the month. Values less than
   * 1 or greater than the number of days in the current month, may rollover
   * to the month and year. Fractional numbers are truncated.
   */
  setDay(day: number): Time;
  /**
   * Return a new `Time` with the updated **zero-based** (0 = Sunday) day of
   * the week. May increase or decrease the day of the month, which may
   * result in changes to the month or year. Fractional numbers are
   * truncated.
   */
  setDayOfWeek(day: number): Time;
  /**
   * Return a new `Time` with the updated hour of the day. Values outside of
   * 0-23 will rollover to the day, month, or year. Fractional numbers are
   * truncated.
   */
  setHour(hour: number): Time;
  /**
   * Return a new `Time` with the updated minute of the hour. Values outside
   * of 0-59 will rollover to the hour, day, month, or year. Fractional
   * numbers are truncated.
   */
  setMinute(minute: number): Time;
  /**
   * Return a new `Time` with the updated second of the minute. Values
   * outside of 0-59 will rollover to the minute, hour, day, month, or year.
   * Fractional numbers are truncated.
   */
  setSecond(second: number): Time;
  /**
   * Return a new `Time` with the updated millisecond of the second. Values
   * outside of 0-999 will rollover to the second, minute, hour, day, month,
   * or year. Fractional numbers are truncated.
   */
  setMs(ms: number): Time;

  // Adders

  /**
   * Return a new `Time` with the incremented year. Fractional numbers are
   * truncated. Negative numbers are allowed.
   */
  addYears(years: number): Time;
  /**
   * Return a new `Time` with the incremented month. Fractional numbers are
   * truncated. Negative numbers are allowed.
   */
  addMonths(months: number): Time;
  /**
   * Return a new `Time` with the incremented day. Fractional numbers are
   * truncated. Negative numbers are allowed.
   */
  addDays(days: number): Time;
  /**
   * Return a new `Time` with the incremented hour. Fractional numbers are
   * truncated. Negative numbers are allowed.
   */
  addHours(hours: number): Time;
  /**
   * Return a new `Time` with the incremented minute. Fractional numbers are
   * truncated. Negative numbers are allowed.
   */
  addMinutes(minutes: number): Time;
  /**
   * Return a new `Time` with the incremented second. Fractional numbers are
   * truncated. Negative numbers are allowed.
   */
  addSeconds(seconds: number): Time;
  /**
   * Return a new `Time` with the incremented millisecond. Fractional numbers
   * are truncated. Negative numbers are allowed.
   */
  addMs(milliseconds: number): Time;
}
