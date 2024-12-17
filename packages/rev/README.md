# @seahax/rev

Smart(-ish) dumb versioning.

The commit "conventions" are simple, and the CHANGELOG isn't that pretty. But, it's simple.

## Commit Messages

All commits are assumed to be at least patch changes.

If the commit title (aka: message first line) starts with `feat:`, then it is considered a minor change.

If the commit title starts with any single word (ie. no spaces) followed by an exclamation mark and a colon (eg. `feat!:`), then it is considered a major change.

## Changelog

If no `CHANGELOG.md` exists, one is created.

If the changelog is new or doesn't start with a `# Changelog` heading, it's added.

New change messages are inserted after the above heading, and before all existing change messages.

Change log message example:

```md
## 1.2.3 - 2024-01-20

- some patch change (1234abcd)
- feat: some minor change (2345abcd)
- feat!: some major change (3456abcd)
```