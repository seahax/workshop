# @seahax/rev

Conventional(-ish) versioning.

- [Features](#features)
- [Getting Started](#getting-started)
- [Committing](#committing)
- [Versioning](#versioning)
  - [Changelog](#changelog)
- [Publishing](#publishing)

## Features

- Private packages are ignored.
- Public package versions are always bumped by at least a patch number, even if there are no new commits.
- Commit aggregation is based on published NPM registry metadata (`gitHead`) instead of git tags.
- Commits are included in the changelog (as patch changes) even if they are not strictly conventional.

Non-features:

- Git tags are not consumed or created.
- Is not independently aware of workspaces or monorepos.

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

This tool is not monorepo aware. To use it in a monorepo, use a tool like PNPM to run it in all packages.

```sh
pnpm -r exec rev
```

## Committing

This tool tries to determine the bump type based on conventional(-ish) commit subjects (ie. the first line of each commit message). It does not strictly follow the conventional commits spec.

A commit subject that starts with `<type>!:` (where `<type>` is any string without whitespace), is considered a major change.

```
feat!: made some change that will break everything
```

A commit subject that starts with `feat:` (no exclamation mark before the colon) is considered a minor change.

```
feat: made some change that adds a new feature and shouldn't break old ones
```

## Versioning

The version is always incremented by _at-least_ a patch number, regardless of commit history. This may result in a new version for an unchanged package.

A minor or major increment may be used if indicated by "conventional" commit messages that were added after the current version (or most recent previous version) was published.

### Changelog

A `CHANGELOG.md` file is created or updated with the relevant commit messages. New change entries are added before the first second level heading (ie. `##`), or at the end of the file. No attempt is made to sort or deduplicate existing entries.

Changelog entries have a second level heading (`##`) which includes the version number and the date the entry was added. The body of the entry is a list of commit subject lines and hashes.

```md
## 1.2.3 - 2024-01-20

- some patch change (1234abcd)
- feat: some minor change (2345abcd)
- feat!: some major change (3456abcd)
```

## Publishing

This tool does not publish the package. Use a tool like PNPM to publish the package after versioning.

```sh
pnpm publish

# In a monorepo.
pnpm -r publish

# Fail (instead of skip) already published versions.
pnpm -r publish --force
```
