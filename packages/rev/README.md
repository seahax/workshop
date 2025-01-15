# @seahax/rev

Conventional(-ish) versioning.

- [Getting Started](#getting-started)
- [Git](#git)
- [Monorepos](#monorepos)
- [Committing](#committing)
- [Versioning](#versioning)
- [Publishing](#publishing)


## Getting Started

Install the package in your project, and run the command via `npx` or as a package script.

```sh
npm install --save-dev @seahax/rev
npx @seahax/rev
```

Alternatively, install the package globally.

```sh
npm install --global @seahax/rev
rev
```

## Git

This tool does not create tags or commits. It _does_ require a clean working tree, and will fail if there are uncommitted changes.

## Monorepos

This tool is not monorepo aware. To use it in a monorepo, use a tool like PNPM or Lerna to run the command in all public workspaces.

Example using Lerna:
```sh
# Assumes Lerna and @seahax/rev are installed locally in the monorepo root.
npx lerna exec --no-private -- rev
```

## Committing

This tool tries to determine the bump type based on conventional(-ish) commit subjects (first message line). It does not strictly follow the conventional commits spec.

A commit subject that starts with `<type>!:` (where `<type>` is any string without whitespace), is considered a major change.

```
feat!: made some change that will break everything
```

A commit subject that starts with `feat:` (no exclamation mark before the colon) is considered a minor change.

```
feat: made some change that adds a new feature and shouldn't break old ones
```

## Versioning

For simplicity, the version is always incremented by _at-least_ a patch number, regardless of commit history. This may result in new versions for unchanged packages.

A minor or major increment may be used if indicated by "conventional" commit messages that were added after the current package version (or most recent previous version) was published.

A `CHANGELOG.md` file is created or updated with the relevant commit messages. New change messages are added before the first second level heading (ie. `##`), or at the end of the file. No attempt is made to sort or deduplicate versions.

Changelog entries have a second level heading (`##`) with the version number, and the date the entry was added. The body of the entry is a list of commit subjects (first message lines) and their hashes in parentheses.

```md
## 1.2.3 - 2024-01-20

- some patch change (1234abcd)
- feat: some minor change (2345abcd)
- feat!: some major change (3456abcd)
```

## Publishing

This tool does not publish. Use a tool like PNPM or Lerna to publish packages after running this command.
