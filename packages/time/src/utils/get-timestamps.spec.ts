import { type Assertion, describe, expect, test } from 'vitest';

import { type ClockTuple } from '../types/clock-tuple.js';
import { getTimestamps } from './get-timestamps.js';

const TZ_LOS_ANGELES = 'America/Los_Angeles';
const TZ_CAIRO = 'Africa/Cairo';
const TZ_PARAGUAY = 'America/Asuncion';
const TZ_ADELAIDE = 'Australia/Adelaide';
const TZ_KIRITIMATI = 'Pacific/Kiritimati';

describe('getTimestamps', () => {
  test('winter not DST', () => {
    expectTimestamps([2024, 1, 2, 3, 4, 5, 6], TZ_LOS_ANGELES).toMatchInlineSnapshot(
      `"1/2/2024, 03:04:05.006 GMT-8"`,
    );
    expectTimestamps([2024, 1, 2, 3, 4, 5, 6], TZ_CAIRO).toMatchInlineSnapshot(`"1/2/2024, 03:04:05.006 GMT+2"`);
    expectTimestamps([2024, 7, 2, 3, 4, 5, 6], TZ_PARAGUAY).toMatchInlineSnapshot(`"7/2/2024, 03:04:05.006 GMT-4"`);
    expectTimestamps([2024, 7, 2, 3, 4, 5, 6], TZ_ADELAIDE).toMatchInlineSnapshot(
      `"7/2/2024, 03:04:05.006 GMT+9:30"`,
    );
  });

  test('summer DST', () => {
    expectTimestamps([2024, 7, 2, 3, 4, 5, 6], TZ_LOS_ANGELES).toMatchInlineSnapshot(
      `"7/2/2024, 03:04:05.006 GMT-7"`,
    );
    expectTimestamps([2024, 7, 2, 3, 4, 5, 6], TZ_CAIRO).toMatchInlineSnapshot(`"7/2/2024, 03:04:05.006 GMT+3"`);
    expectTimestamps([2024, 1, 2, 3, 4, 5, 6], TZ_PARAGUAY).toMatchInlineSnapshot(`"1/2/2024, 03:04:05.006 GMT-3"`);
    expectTimestamps([2024, 1, 2, 3, 4, 5, 6], TZ_ADELAIDE).toMatchInlineSnapshot(
      `"1/2/2024, 03:04:05.006 GMT+10:30"`,
    );
  });

  test('spring DST gap', () => {
    // 2:00-3:00 on March 10, 2024 does not exist in America/Los_Angeles
    // (Northern negative GMT offset).
    expectTimestamps([2024, 3, 10, 2], TZ_LOS_ANGELES).toMatchInlineSnapshot(
      `"3/10/2024, 03:00:00.000 GMT-7; 3/10/2024, 01:00:00.000 GMT-8"`,
    );
    expectTimestamps([2024, 3, 10, 2, 30], TZ_LOS_ANGELES).toMatchInlineSnapshot(
      `"3/10/2024, 03:30:00.000 GMT-7; 3/10/2024, 01:30:00.000 GMT-8"`,
    );
    expectTimestamps([2024, 3, 10, 2, 59, 59, 999], TZ_LOS_ANGELES).toMatchInlineSnapshot(
      `"3/10/2024, 03:59:59.999 GMT-7; 3/10/2024, 01:59:59.999 GMT-8"`,
    );

    // 0:00-1:00 on April 26, 2024 does not exist in Africa/Cairo (Northern
    // positive GMT offset).
    expectTimestamps([2024, 4, 26], TZ_CAIRO).toMatchInlineSnapshot(
      `"4/26/2024, 01:00:00.000 GMT+3; 4/25/2024, 23:00:00.000 GMT+2"`,
    );
    expectTimestamps([2024, 4, 26, 0, 30], TZ_CAIRO).toMatchInlineSnapshot(
      `"4/26/2024, 01:30:00.000 GMT+3; 4/25/2024, 23:30:00.000 GMT+2"`,
    );
    expectTimestamps([2024, 4, 26, 0, 59, 59, 999], TZ_CAIRO).toMatchInlineSnapshot(
      `"4/26/2024, 01:59:59.999 GMT+3; 4/25/2024, 23:59:59.999 GMT+2"`,
    );

    // 0:00-1:00 on October 6, 2024 does not exist in America/Asuncion
    // (Southern negative GMT offset).
    expectTimestamps([2024, 10, 6], TZ_PARAGUAY).toMatchInlineSnapshot(
      `"10/6/2024, 01:00:00.000 GMT-3; 10/5/2024, 23:00:00.000 GMT-4"`,
    );
    expectTimestamps([2024, 10, 6, 0, 30], TZ_PARAGUAY).toMatchInlineSnapshot(
      `"10/6/2024, 01:30:00.000 GMT-3; 10/5/2024, 23:30:00.000 GMT-4"`,
    );
    expectTimestamps([2024, 10, 6, 0, 59, 59, 999], TZ_PARAGUAY).toMatchInlineSnapshot(
      `"10/6/2024, 01:59:59.999 GMT-3; 10/5/2024, 23:59:59.999 GMT-4"`,
    );

    // 2:00-3:00 on October 6, 2024 does not exist in Australia/Adelaide
    // (Southern positive GMT offset).
    expectTimestamps([2024, 10, 6, 2], TZ_ADELAIDE).toMatchInlineSnapshot(
      `"10/6/2024, 03:00:00.000 GMT+10:30; 10/6/2024, 01:00:00.000 GMT+9:30"`,
    );
    expectTimestamps([2024, 10, 6, 2, 30], TZ_ADELAIDE).toMatchInlineSnapshot(
      `"10/6/2024, 03:30:00.000 GMT+10:30; 10/6/2024, 01:30:00.000 GMT+9:30"`,
    );
    expectTimestamps([2024, 10, 6, 2, 59, 59, 999], TZ_ADELAIDE).toMatchInlineSnapshot(
      `"10/6/2024, 03:59:59.999 GMT+10:30; 10/6/2024, 01:59:59.999 GMT+9:30"`,
    );
  });

  test('spring after DST gap', () => {
    expectTimestamps([2024, 3, 10, 3], TZ_LOS_ANGELES).toMatchInlineSnapshot(`"3/10/2024, 03:00:00.000 GMT-7"`);
    expectTimestamps([2024, 3, 10, 9, 59, 59, 999], TZ_LOS_ANGELES).toMatchInlineSnapshot(
      `"3/10/2024, 09:59:59.999 GMT-7"`,
    );

    expectTimestamps([2024, 4, 25, 22], TZ_CAIRO).toMatchInlineSnapshot(`"4/25/2024, 22:00:00.000 GMT+2"`);
    expectTimestamps([2024, 4, 25, 23, 59, 59, 999], TZ_CAIRO).toMatchInlineSnapshot(
      `"4/25/2024, 23:59:59.999 GMT+2"`,
    );

    expectTimestamps([2024, 10, 6, 1], TZ_PARAGUAY).toMatchInlineSnapshot(`"10/6/2024, 01:00:00.000 GMT-3"`);
    expectTimestamps([2024, 10, 6, 1, 59, 59, 999], TZ_PARAGUAY).toMatchInlineSnapshot(
      `"10/6/2024, 01:59:59.999 GMT-3"`,
    );

    expectTimestamps([2024, 10, 6, 3], TZ_ADELAIDE).toMatchInlineSnapshot(`"10/6/2024, 03:00:00.000 GMT+10:30"`);
    expectTimestamps([2024, 10, 6, 3, 59, 59, 999], TZ_ADELAIDE).toMatchInlineSnapshot(
      `"10/6/2024, 03:59:59.999 GMT+10:30"`,
    );
  });

  test('fall DST overlap', () => {
    // 1:00-2:00 on March 10, 2024 is repeated in America/Los_Angeles (Northern
    // negative GMT offset).
    expectTimestamps([2024, 11, 3, 1], TZ_LOS_ANGELES).toMatchInlineSnapshot(`"11/3/2024, 01:00:00.000 GMT-7"`);
    expectTimestamps([2024, 11, 3, 1, 30], TZ_LOS_ANGELES).toMatchInlineSnapshot(`"11/3/2024, 01:30:00.000 GMT-7"`);
    expectTimestamps([2024, 11, 3, 1, 59, 59, 999], TZ_LOS_ANGELES).toMatchInlineSnapshot(
      `"11/3/2024, 01:59:59.999 GMT-7"`,
    );

    // 23:00-0:00 on October 31, 2024 is repeated in Africa/Cairo (Northern
    // positive GMT offset).
    expectTimestamps([2024, 10, 31, 23], TZ_CAIRO).toMatchInlineSnapshot(`"10/31/2024, 23:00:00.000 GMT+3"`);
    expectTimestamps([2024, 10, 31, 23, 30], TZ_CAIRO).toMatchInlineSnapshot(`"10/31/2024, 23:30:00.000 GMT+3"`);
    expectTimestamps([2024, 10, 31, 23, 59, 59, 999], TZ_CAIRO).toMatchInlineSnapshot(
      `"10/31/2024, 23:59:59.999 GMT+3"`,
    );

    // 23:00-0:00 on March 23, 2024 is repeated in America/Asuncion (Southern
    // negative GMT offset).
    expectTimestamps([2024, 3, 23, 23], TZ_PARAGUAY).toMatchInlineSnapshot(`"3/23/2024, 23:00:00.000 GMT-3"`);
    expectTimestamps([2024, 3, 23, 23, 30], TZ_PARAGUAY).toMatchInlineSnapshot(`"3/23/2024, 23:30:00.000 GMT-3"`);
    expectTimestamps([2024, 3, 23, 23, 59, 59, 999], TZ_PARAGUAY).toMatchInlineSnapshot(
      `"3/23/2024, 23:59:59.999 GMT-3"`,
    );

    // 2:00-3:00 on April 7, 2024 is repeated in Australia/Adelaide (Southern
    // positive GMT offset).
    expectTimestamps([2024, 4, 7, 2], TZ_ADELAIDE).toMatchInlineSnapshot(`"4/7/2024, 02:00:00.000 GMT+10:30"`);
    expectTimestamps([2024, 4, 7, 2, 30], TZ_ADELAIDE).toMatchInlineSnapshot(`"4/7/2024, 02:30:00.000 GMT+10:30"`);
    expectTimestamps([2024, 4, 7, 2, 59, 59, 999], TZ_ADELAIDE).toMatchInlineSnapshot(
      `"4/7/2024, 02:59:59.999 GMT+10:30"`,
    );
  });

  test('fall after DST overlap', () => {
    expectTimestamps([2024, 11, 3, 2], TZ_LOS_ANGELES).toMatchInlineSnapshot(`"11/3/2024, 02:00:00.000 GMT-8"`);
    expectTimestamps([2024, 11, 3, 2], TZ_LOS_ANGELES).toMatchInlineSnapshot(`"11/3/2024, 02:00:00.000 GMT-8"`);

    expectTimestamps([2024, 11, 1], TZ_CAIRO).toMatchInlineSnapshot(`"11/1/2024, 00:00:00.000 GMT+2"`);
    expectTimestamps([2024, 11, 1, 1, 59, 59, 999], TZ_CAIRO).toMatchInlineSnapshot(
      `"11/1/2024, 01:59:59.999 GMT+2"`,
    );

    expectTimestamps([2024, 3, 24], TZ_PARAGUAY).toMatchInlineSnapshot(`"3/24/2024, 00:00:00.000 GMT-4"`);
    expectTimestamps([2024, 3, 24, 0, 59, 59, 999], TZ_PARAGUAY).toMatchInlineSnapshot(
      `"3/24/2024, 00:59:59.999 GMT-4"`,
    );

    expectTimestamps([2024, 4, 7, 3], TZ_ADELAIDE).toMatchInlineSnapshot(`"4/7/2024, 03:00:00.000 GMT+9:30"`);
    expectTimestamps([2024, 4, 7, 3, 59, 59, 999], TZ_ADELAIDE).toMatchInlineSnapshot(
      `"4/7/2024, 03:59:59.999 GMT+9:30"`,
    );
  });

  test('Kiritimati when the IDL moved', () => {
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

    expectTimestamps([1994, 12, 30, 23, 59, 59, 999], TZ_KIRITIMATI).toMatchInlineSnapshot(
      `"12/30/1994, 23:59:59.999 GMT-10"`,
    );
    expectTimestamps([1994, 12, 31], TZ_KIRITIMATI).toMatchInlineSnapshot(
      `"1/1/1995, 00:00:00.000 GMT+14; 12/30/1994, 00:00:00.000 GMT-10"`,
    );
  });
});

function expectTimestamps(clock: ClockTuple, tz: string): Assertion<string> {
  const timestamps0 = getTimestamps(clock, tz);
  const timestamps1 = getTimestamps(
    {
      year: clock[0],
      month: clock[1],
      day: clock[2],
      hour: clock[3],
      minute: clock[4],
      second: clock[5],
      ms: clock[6],
    },
    tz,
  );

  // Using a tuple or an object should yield the same result.
  expect(timestamps0).toEqual(timestamps1);

  return expect(timestamps1.map((timestamp) => timestampSnapshot(timestamp, tz)).join('; '));
}

function timestampSnapshot(timestamp: number, timeZone: string): string {
  return new Date(timestamp).toLocaleString('en-us', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'shortOffset',
    hourCycle: 'h23',
    fractionalSecondDigits: 3,
  });
}
