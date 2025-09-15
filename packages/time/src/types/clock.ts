export interface Clock {
  /**
   * Year. Fractional values are truncated.
   */
  readonly year?: number;
  /**
   * **One-based** month (1-12, 1 = January). Fractional values are
   * truncated. Negative numbers are allowed. Values which are out of range
   * will rollover to the year.
   */
  readonly month?: number;
  /**
   * Day of the month (1-31). Fractional values are truncated. Negative
   * numbers are allowed. Values which are out of range will rollover to the
   * month or year.
   */
  readonly day?: number;
  /**
   * Hour of the day (0-23). Fractional values are truncated. Negative
   * numbers are allowed. Values which are out of range will rollover to the
   * day, month, or year.
   */
  readonly hour?: number;
  /**
   * Minute of the hour (0-59). Fractional values are truncated. Negative
   * numbers are allowed. Values which are out of range will rollover to the
   * hour, day, month, or year.
   */
  readonly minute?: number;
  /**
   * Second of the minute (0-59). Fractional values are truncated. Negative
   * numbers are allowed. Values which are out of range will rollover to the
   * minute, hour, day, month, or year.
   */
  readonly second?: number;
  /**
   * Millisecond of the second (0-999). Fractional values are truncated.
   * Negative numbers are allowed. Values which are out of range will rollover
   * to the second, minute, hour, day, month, or year.
   */
  readonly ms?: number;
}
