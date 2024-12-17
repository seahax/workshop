# @seahax/rev

Smart(-ish) dumb versioning.

The commit "conventions" are simple, and the CHANGELOG isn't that pretty. But, it's simple.

## Commit Messages

All commits are assumed to be at least patch changes.

If the commit title (aka: message first line) starts with `feat:`, then it is considered a minor change.

If the commit title starts with any single word (ie. no spaces) followed by an exclamation mark and a colon (eg. `feat!:`), then it is considered a major change.
