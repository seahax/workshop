import { HOUR_AS_MS, MINUTE_AS_MS, SECOND_AS_MS } from './constants/durations.js';
import { type Clock } from './types/clock.js';
import { type ClockTuple } from './types/clock-tuple.js';
import { type ReadonlyTime } from './types/readonly-time.js';
import { type Time } from './types/time.js';
import { getReadonlyTime } from './utils/get-readonly-time.js';
import { getTimestamps } from './utils/get-timestamps.js';

const keyGetters = {
  year: 'getYear',
  month: 'getMonth',
  day: 'getDay',
  hour: 'getHour',
  minute: 'getMinute',
  second: 'getSecond',
  ms: 'getMs',
} as const satisfies Record<keyof Clock, keyof ReadonlyTime>;

export function time(init: number | Clock | ClockTuple, tz: string): Time {
  const timestamp = typeof init === 'number' ? init : Math.max(...getTimestamps(init, tz));
  const readable = getReadonlyTime(timestamp, tz);

  return addModifiers(readable);
}

function addModifiers(time: ReadonlyTime): Time {
  const self: Time = Object.assign(time, {
    setTz: (tz) => addModifiers(getReadonlyTime(time.valueOf(), tz)),
    setYear: (year) => set('year', year),
    setMonth: (month) => set('month', month),
    setDay: (day) => set('day', day),
    setDayOfWeek: (day) => set('day', time.getDay() + (day - time.getDayOfWeek())),
    setHour: (hour) => set('hour', hour),
    setMinute: (minute) => set('minute', minute),
    setSecond: (second) => set('second', second),
    setMs: (ms) => set('ms', ms),
    addYears: (years) => addLogically('year', years),
    addMonths: (months) => addLogically('month', months),
    addDays: (days) => addLogically('day', days),
    addHours: (hours) => addArithmetically(hours * HOUR_AS_MS),
    addMinutes: (minutes) => addArithmetically(minutes * MINUTE_AS_MS),
    addSeconds: (seconds) => addArithmetically(seconds * SECOND_AS_MS),
    addMs: (ms) => addArithmetically(ms),
  } satisfies Omit<Time, keyof ReadonlyTime>);

  return self;

  function set(key: keyof Clock, value: number): Time {
    // When setting a clock time that does not exist due to DST, choose the
    // latest timestamp (ie. after the DST change).
    const timestamp = Math.max(...getTimestamps({ ...time.toClock(), [key]: value }, time.getTz()));

    let nextInfo = getReadonlyTime(timestamp, time.getTz());

    if (key === 'year' || key === 'month') {
      nextInfo = fixDate(nextInfo);
    }

    return addModifiers(nextInfo);
  }

  /**
   * Adding years, months, or days is done logically, based on the clock
   * components. Because there is no fixed amount of time that equals a year,
   * month, or day.
   */
  function addLogically(key: Extract<keyof Clock, 'year' | 'month' | 'day'>, increment: number): Time {
    increment = Math.trunc(increment);

    if (increment === 0) {
    // Adding nothing is a no-op.
      return self;
    }

    const getter = keyGetters[key];
    const value = time[getter]();
    const timestamps = getTimestamps({ ...time.toClock(), [key]: value + increment }, time.getTz());

    // When incrementing to a clock time that does not exist due to DST,
    // choose the earliest timestamp (ie. before the DST change) if it's a
    // negative increment, otherwise choose the latest timestamp (ie. after
    // the DST change).
    const timestamp = increment < 0 ? Math.min(...timestamps) : Math.max(...timestamps);

    let nextInfo = getReadonlyTime(timestamp, time.getTz());

    if (key === 'year' || key === 'month') {
      nextInfo = fixDate(nextInfo);
    }

    return addModifiers(nextInfo);
  }

  /**
   * Adding hours, minutes, seconds, or milliseconds is done arithmetically.
   * These units are always the same number of milliseconds in duration, even
   * if they result in a wall-clock change that appears to have changed more
   * or less (eg. DST changes on Lord Howe Island, Australia).
   */
  function addArithmetically(ms: number): Time {
    ms = Math.trunc(ms);

    if (ms === 0) {
    // Adding nothing is a no-op.
      return self;
    }

    return addModifiers(getReadonlyTime(time.valueOf() + ms, time.getTz()));
  }

  /**
   * The day may not exist when changing the year or month. The out of range
   * day will then rollover and increment the month, which can be detected if
   * the day unexpectedly changes. To fix it, set the day to 0, which
   * effectively moves back to the last day of the previous month, correcting
   * the rolled over month.
   */
  function fixDate(nextInfo: ReadonlyTime): ReadonlyTime {
    if (nextInfo.getDay() !== time.getDay()) {
      // Moving the time backwards, so choose the earliest timestamp if
      // there's a DST gap.
      const timestamp = Math.min(...getTimestamps({ ...nextInfo.toClock(), day: 0 }, time.getTz()));

      nextInfo = getReadonlyTime(timestamp, time.getTz());
    }

    return nextInfo;
  }
}
