# @seahax/time

_Work in progress._

Immutable date and time with timezone and arithmetic support.

- Uses the built-in `Intl` API for timezone support which keeps the library small and avoids required updates when timezones are redefined.
- Adding, subtracting, and setting times is 100% predictable, regardless of the current/starting time or timezone redefinitions.
