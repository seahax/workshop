import { DAY_AS_MS } from '../constants/durations.js';
import { type Clock } from '../types/clock.js';
import { type ClockTuple } from '../types/clock-tuple.js';
import { type ReadonlyTime } from '../types/readonly-time.js';
import { getReadonlyTime } from './get-readonly-time.js';
import { lazy } from './lazy.js';

/**
 * Get the timestamps that correspond to the clock components and time zone. If
 * the clock time doesn't exist due to DST, then two timestamp options are
 * returned: one for the time before and one for after the DST change.
 */
export function getTimestamps(clock: ClockTuple | Clock, tz: string): [number] | [number, number] {
  const timestampUtc = getUtcTimestamp(clock, tz);
  const offset0 = getReadonlyTime(timestampUtc - DAY_AS_MS, tz).getTzOffsetMs();
  const timestamp0 = timestampUtc - offset0;
  const offset1 = getReadonlyTime(timestamp0, tz).getTzOffsetMs();

  if (offset0 === offset1) {
    // No DST change, or DST is beginning. The timestamp guess (timestamp0) is
    // correct.
    return [timestamp0];
  }

  // DST is ending, so the initial timestamp guess (timestamp0) is: a) one of
  // two options for a DST gap, or b) incorrect.
  const timestamp1 = timestampUtc - offset1;
  const offsetCheck = getReadonlyTime(timestamp1, tz).getTzOffsetMs();

  if (offset1 === offsetCheck) {
    // DST ended, so the initial guess and timestamp were incorrect. The second
    // one is verified to be correct (not DST gap).
    return [timestamp1];
  }

  // DST gap, so there is no timestamp that corresponds to the clock, and both
  // are considered possible options. One falls before the gap, and one after.
  // The caller can decide which one to use (usually the later one).
  return [timestamp0, timestamp1];
}

function getUtcTimestamp(clock: ClockTuple | Clock, tz: string): number {
  const [year, month, day, hour, minute, second, ms] = getTuple(clock, tz);

  // XXX: Can't use the Date.UTC utility because it interprets 0-99 as a two
  // digit year (ie. 1900-1999). Luckily, the Date setUTCFullYear method is
  // more reasonable and treats 0-99 as 0000-0099.
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  d.setUTCHours(hour, minute, second, ms);

  return d.valueOf();
}

function getTuple(clock: ClockTuple | Clock, tz: string): Required<ClockTuple> {
  const getDefaults = lazy((): ReadonlyTime => getReadonlyTime(Date.now(), tz));

  const [
    year = getDefaults().getYear(),
    month = getDefaults().getMonth(),
    day = getDefaults().getDay(),
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  ] = isTuple(clock)
    ? clock
    : ([clock.year, clock.month, clock.day, clock.hour, clock.minute, clock.second, clock.ms] as const);

  return [year, month, day, hour, minute, second, millisecond];
}

function isTuple(clock: ClockTuple | Clock): clock is ClockTuple {
  return Array.isArray(clock);
}
