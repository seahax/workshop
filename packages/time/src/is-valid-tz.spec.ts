import { afterEach, describe, expect, test, vi } from 'vitest';

const TZ_NEW_YORK = 'America/New_York';

describe('isValidTimeZone', () => {
  afterEach(() => {
    // Reset and reimport the isValidTimeZone module after each test,
    // because it uses a cache that is module-scoped.
    vi.resetModules();
  });

  test('valid time zone', async () => {
    const { isValidTz } = await import('./is-valid-tz.js');

    expect(isValidTz(TZ_NEW_YORK)).toBe(true);
  });

  test('invalid time zone', async () => {
    const { isValidTz } = await import('./is-valid-tz.js');

    expect(isValidTz('foo')).toBe(false);
  });

  test('invalid ISO offset', async () => {
    const { isValidTz } = await import('./is-valid-tz.js');

    expect(isValidTz('-07:00')).toBe(false);
  });
});
