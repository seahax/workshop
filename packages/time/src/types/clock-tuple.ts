/**
 * A numeric tuple from length 0-7 representing a clock time. Values with
 * fractional parts are truncated.
 *
 * **NOTE:** Values that are out of the expected range will rollover to the
 * next unit (eg. month 12 will become month 0 and the year will increment).
 *
 * Indexes:
 * - 0: Year
 * - 1: Month (**one-based**, 1 = January)
 * - 2: Day (day of the month)
 * - 3: Hour
 * - 4: Minute
 * - 5: Second
 * - 6: Millisecond
 */
export type ClockTuple = readonly [
  year?: number,
  month?: number,
  day?: number,
  hour?: number,
  minute?: number,
  second?: number,
  ms?: number,
];
