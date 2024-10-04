# @seahax/bump

Conventional commit versioning tool that doesn't use Git tags.

Steps:

- Read NPM gitHead metadata.
- Read conventional commits.
- Write bumped version.
- Write changelog.

## Usage

```sh
npx @seahax/bump
```

Validation is also possible. This will validate that all relevant Git commits contain conventional commit messages, and display the version bump. No files will be modified.

```sh
npx @seahax/bump validate
```

## Convention Commits

Follows a loose version of the conventional commit spec.

- Any line in a commit that matches `<type>[optional scope]: <description>` is parsed as a conventional commit message. Multiple matches per commit are allowed.
- Supported types: `fix`, `feat`, `build`, `chore`, `ci`, `docs`, `perf`, `refactor`, `revert`, `style`, `test`, or `improvement`.
- Types are case-insensitive.
- An exclamation mark before the colon (`!:`) indicates a breaking change.
- A `BREAKING CHANGE: <description>` line is always optional. If present, it indicates all conventional messages lines in the commit are breaking changes, regardless of exclamation marks.

A commit must contain at least one conventional commit message line to be valid.

## Changelogs

Each changelog entry will be formatted as follows.

```text
## 1.2.3 - 2024-01-02

### Features

- *(optional-scope)* Description, followed by the short commit hash. (1234567)
- One or more list items per type heading. (1234567)

### Fixes

- Each conventional commit type gets its own heading (1234567)
- **[breaking]** Breaking changes include a bold tag. (1234567)
```

The new entry is inserted into the changelog in version order (descending).

The changelog will not be modified for prerelease versions.
