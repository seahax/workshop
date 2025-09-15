/**
 * Time zone strings which have already been validated.
 *
 * **NOTE:** If the `Intl.supportedValuesOf` method is available (circa 2022),
 * it's used to pre-cache valid time zone strings.
 */
const cache = new Map<string, boolean>(Intl.supportedValuesOf?.('timeZone').map((tz) => [tz, true]));

/**
 * Returns true if the time zone is a valid IANA identifier:
 * https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 */
export function isValidTz(tz: string): boolean {
  if (tz.startsWith('+') || tz.startsWith('-')) {
    // Even though time zone offsets will work with `DateTimeFormat`, they
    // are not IANA time zone identifiers, which is what we're trying to
    // validate.
    return false;
  }

  const cached = cache.get(tz);

  if (cached != null) {
    return cached;
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    cache.set(tz, true);
    return true;
  }
  catch {
    cache.set(tz, false);
    return false;
  }
}
