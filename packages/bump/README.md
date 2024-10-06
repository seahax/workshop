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

## Convention Commits

Follows a loose version of the conventional commit spec.

- Any line in a commit that matches `<type>[optional scope]: <description>` is parsed as a conventional commit message. Multiple matches per commit are allowed.
- An exclamation mark after the type and scope, and before the colon (`!:`),indicates a breaking change.
- A `BREAKING CHANGE: <description>` line is always optional. If present, it indicates all conventional messages lines in the commit are breaking changes, regardless of exclamation marks.

### Supported Commit Types

- `feat`: A new feature.
- `fix`: A bug fix.
- `perf`: Improve performance.
- `improvement`: Improve an existing feature.
- `style`: Change that does not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- `revert`: Undo a previous change.
- `refactor`: Change that neither fixes a bug nor adds a feature.
- `docs`: Add documentation.
- `test`: Add missing tests or correct existing tests.
- `build`: Changes that affect the build.
- `ci`: Changes to the CI configuration.
- `chore`: Other changes that don't modify source or test files.

Types are case-insensitive.

## Changelogs

Each changelog entry will be formatted as follows.

```text
## 1.2.3 (2024-01-02)

### Features

- *(optional-scope)* Description, followed by the short commit hash. (1234567)
- One or more list items per type heading. (1234567)

### Fixes

- Each conventional commit type gets its own heading (1234567)
- **[breaking]** Breaking changes include a bold tag. (1234567)
```

The new entry is inserted into the changelog in version order (descending).

The changelog will not be modified for prerelease versions.
