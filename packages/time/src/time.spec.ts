import { describe, expect, test } from 'vitest';

import { time } from './time.js';
import type { ReadonlyTime } from './types/readonly-time.js';
import { type Time } from './types/time.js';

/** 2024-10-01 18:01:47.045 GMT-04:00 */
const TIMESTAMP = 1727820107045;
const TZ_NEW_YORK = 'America/New_York';
const TZ_LOS_ANGELES = 'America/Los_Angeles';
const TZ_KIRITIMATI = 'Pacific/Kiritimati';
const TZ_LORD_HOWE = 'Australia/Lord_Howe';

describe('time', () => {
  test('construct with timestamp', () => {
    expect(snapshot(time(TIMESTAMP, TZ_NEW_YORK))).toMatchInlineSnapshot(`
      "getTz: America/New_York
      getTzOffset: -04:00
      getTzOffsetMs: -14400000
      getYear: 2024
      getMonth: 10
      getDay: 1
      getDayOfWeek: 2
      getHour: 18
      getMinute: 1
      getSecond: 47
      getMs: 45
      toClock: {"year":2024,"month":10,"day":1,"hour":18,"minute":1,"second":47,"ms":45}"
    `);
  });

  test('construct with tuple', () => {
    expect(snapshot(time([2024, 10, 1, 18, 1, 47, 45], TZ_NEW_YORK))).toMatchInlineSnapshot(`
      "getTz: America/New_York
      getTzOffset: -04:00
      getTzOffsetMs: -14400000
      getYear: 2024
      getMonth: 10
      getDay: 1
      getDayOfWeek: 2
      getHour: 18
      getMinute: 1
      getSecond: 47
      getMs: 45
      toClock: {"year":2024,"month":10,"day":1,"hour":18,"minute":1,"second":47,"ms":45}"
    `);
  });

  test('construct with dict', () => {
    const dict = {
      year: 2024,
      month: 10,
      day: 1,
      hour: 18,
      minute: 1,
      second: 47,
      ms: 45,
    };

    expect(snapshot(time(dict, TZ_NEW_YORK))).toMatchInlineSnapshot(`
      "getTz: America/New_York
      getTzOffset: -04:00
      getTzOffsetMs: -14400000
      getYear: 2024
      getMonth: 10
      getDay: 1
      getDayOfWeek: 2
      getHour: 18
      getMinute: 1
      getSecond: 47
      getMs: 45
      toClock: {"year":2024,"month":10,"day":1,"hour":18,"minute":1,"second":47,"ms":45}"
    `);
  });

  test('set', () => {
    const t = time([2024, 10, 1, 18, 1, 47, 45], TZ_NEW_YORK)
      .setYear(2025)
      .setMonth(7)
      .setDay(5)
      .setHour(3)
      .setMinute(33)
      .setSecond(21)
      .setMs(413);

    expect(toString(t)).toMatchInlineSnapshot(`"2025-07-05 03:33:21.413 GMT-04:00"`);

    expect(toString(t.setDayOfWeek(3))).toMatchInlineSnapshot(`"2025-07-02 03:33:21.413 GMT-04:00"`);
    expect(t.setDayOfWeek(3).getDayOfWeek()).toBe(3);

    expect(t.setTz(TZ_LOS_ANGELES).getTz()).toBe(TZ_LOS_ANGELES);
    expect(toString(t.setTz(TZ_LOS_ANGELES))).toMatchInlineSnapshot(`"2025-07-05 00:33:21.413 GMT-07:00"`);
  });

  test('set rollover', () => {
    const t = time([2024, 10, 1, 18, 1, 47, 45], TZ_NEW_YORK);

    expect(toString(t.setMonth(14))).toMatchInlineSnapshot(`"2025-02-01 18:01:47.045 GMT-05:00"`);
    expect(toString(t.setMonth(-2))).toMatchInlineSnapshot(`"2023-10-01 18:01:47.045 GMT-04:00"`);
    expect(toString(t.setDay(33))).toMatchInlineSnapshot(`"2024-11-02 18:01:47.045 GMT-04:00"`);
    expect(toString(t.setDay(-2))).toMatchInlineSnapshot(`"2024-09-28 18:01:47.045 GMT-04:00"`);
    expect(toString(t.setHour(26))).toMatchInlineSnapshot(`"2024-10-02 02:01:47.045 GMT-04:00"`);
    expect(toString(t.setHour(-2))).toMatchInlineSnapshot(`"2024-09-30 22:01:47.045 GMT-04:00"`);
    expect(toString(t.setMinute(66))).toMatchInlineSnapshot(`"2024-10-01 19:06:47.045 GMT-04:00"`);
    expect(toString(t.setMinute(-6))).toMatchInlineSnapshot(`"2024-10-01 17:54:47.045 GMT-04:00"`);
    expect(toString(t.setSecond(66))).toMatchInlineSnapshot(`"2024-10-01 18:02:06.045 GMT-04:00"`);
    expect(toString(t.setSecond(-6))).toMatchInlineSnapshot(`"2024-10-01 18:00:54.045 GMT-04:00"`);
    expect(toString(t.setMs(1006))).toMatchInlineSnapshot(`"2024-10-01 18:01:48.006 GMT-04:00"`);
    expect(toString(t.setMs(-6))).toMatchInlineSnapshot(`"2024-10-01 18:01:46.994 GMT-04:00"`);
  });

  test('set clamping', () => {
    const t = time([2024, 1, 31], TZ_NEW_YORK);

    expect(t.setMonth(2).toClock()).toMatchObject({ month: 2, day: 29 });
  });

  test('add', () => {
    const t = time([2024, 10, 1, 18, 1, 47, 45], TZ_NEW_YORK);

    expect(toString(t.addYears(3))).toMatchInlineSnapshot(`"2027-10-01 18:01:47.045 GMT-04:00"`);
    expect(toString(t.addMonths(3))).toMatchInlineSnapshot(`"2025-01-01 18:01:47.045 GMT-05:00"`);
    expect(toString(t.addDays(32))).toMatchInlineSnapshot(`"2024-11-02 18:01:47.045 GMT-04:00"`);
    expect(toString(t.addHours(8))).toMatchInlineSnapshot(`"2024-10-02 02:01:47.045 GMT-04:00"`);
    expect(toString(t.addMinutes(63))).toMatchInlineSnapshot(`"2024-10-01 19:04:47.045 GMT-04:00"`);
    expect(toString(t.addSeconds(63))).toMatchInlineSnapshot(`"2024-10-01 18:02:50.045 GMT-04:00"`);
    expect(toString(t.addMs(1006))).toMatchInlineSnapshot(`"2024-10-01 18:01:48.051 GMT-04:00"`);
  });

  test('adding an hour is arithmetic', () => {
    const t = time([2024, 4, 7, 1], TZ_LORD_HOWE);

    expect(toString(t)).toMatchInlineSnapshot(`"2024-04-07 01:00:00.000 GMT+11:00"`);
    expect(toString(t.addHours(1))).toMatchInlineSnapshot(`"2024-04-07 01:30:00.000 GMT+10:30"`);
  });

  test('adding a day is logical', () => {
    const t = time([2024, 4, 7, 1], TZ_LORD_HOWE);

    expect(toString(t)).toMatchInlineSnapshot(`"2024-04-07 01:00:00.000 GMT+11:00"`);
    expect(toString(t.addDays(1))).toMatchInlineSnapshot(`"2024-04-08 01:00:00.000 GMT+10:30"`);
  });

  test('subtract', () => {
    const t = time([2024, 10, 1, 18, 1, 47, 45], TZ_NEW_YORK);

    expect(toString(t.addYears(-3))).toMatchInlineSnapshot(`"2021-10-01 18:01:47.045 GMT-04:00"`);
    expect(toString(t.addMonths(-3))).toMatchInlineSnapshot(`"2024-07-01 18:01:47.045 GMT-04:00"`);
    expect(toString(t.addDays(-32))).toMatchInlineSnapshot(`"2024-08-30 18:01:47.045 GMT-04:00"`);
    expect(toString(t.addHours(-8))).toMatchInlineSnapshot(`"2024-10-01 10:01:47.045 GMT-04:00"`);
    expect(toString(t.addMinutes(-63))).toMatchInlineSnapshot(`"2024-10-01 16:58:47.045 GMT-04:00"`);
    expect(toString(t.addSeconds(-63))).toMatchInlineSnapshot(`"2024-10-01 18:00:44.045 GMT-04:00"`);
    expect(toString(t.addMs(-1006))).toMatchInlineSnapshot(`"2024-10-01 18:01:46.039 GMT-04:00"`);
  });

  test('add 0 returns the same instance', () => {
    const t = time([2024, 10, 1, 18, 1, 47, 45], TZ_NEW_YORK);

    expect(t.addYears(0)).toBe(t);
    expect(t.addMonths(0)).toBe(t);
    expect(t.addDays(0)).toBe(t);
    expect(t.addHours(0)).toBe(t);
    expect(t.addMinutes(0)).toBe(t);
    expect(t.addSeconds(0)).toBe(t);
    expect(t.addMs(0)).toBe(t);
  });

  test('add and subtract in Kiritimati when the IDL moved', () => {
    // Kiritimati (republic of Kiribati) moved to the other side of the IDL
    // on January 1st 1995. To transition, they skipped December 31st 1994.
    // An offset change of 24 hours, from GMT-10 to GMT+14. Samoa and
    // Tokelau did something similar in 2011. This definitely isn't
    // something we expect to happen often, but it serves as a
    // demonstration of handling drastic offsets. As long as the offset
    // from GMT remains less than +/- 24 hours, it should be correctly
    // handled.
    //
    // https://www.timeanddate.com/time/zone/kiribati/kiritimati?year=1995

    expect(toString(time([1994, 12, 30], TZ_KIRITIMATI).addDays(1))).toMatchInlineSnapshot(
      `"1995-01-01 00:00:00.000 GMT+14:00"`,
    );
    expect(toString(time([1995, 1, 1], TZ_KIRITIMATI).addDays(-1))).toMatchInlineSnapshot(
      `"1994-12-30 00:00:00.000 GMT-10:00"`,
    );
  });
});

function snapshot(time: Time): string {
  let snapshot = '';

  for (const getter of Object.keys(time) as Extract<keyof Time, `${'get' | 'to'}${string}`>[]) {
    if (getter.startsWith('get') || getter.startsWith('to')) {
      const value = time[getter]();
      snapshot += `${getter}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
    }
  }

  return snapshot.trim();
}

function toString(time: ReadonlyTime): string {
  let string = '';

  string += String(time.getYear()).padStart(4, '0');
  string += `-${String(time.getMonth()).padStart(2, '0')}`;
  string += `-${String(time.getDay()).padStart(2, '0')}`;
  string += ' ';
  string += String(time.getHour()).padStart(2, '0');
  string += `:${String(time.getMinute()).padStart(2, '0')}`;
  string += `:${String(time.getSecond()).padStart(2, '0')}`;
  string += `.${String(time.getMs()).padStart(3, '0')}`;
  string += ' ';
  string += `GMT${time.getTzOffset()}`;

  return string;
}
