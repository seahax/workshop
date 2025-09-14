# @seahax/rev

Simple project version and release management tool (package manager agnostic).

- [Getting Started](#getting-started)
- [Version](#version)
  - [Commit Messages](#commit-messages)
- [Publish](#publish)


## Getting Started

Install it globally.

```bash
npm install --global @seahax/rev
```

## Version

Make commits in conventional(-ish) commit style. Then run the `version` command at the repo root.

```sh
rev version

# Just to see what would happen, without making any changes.
rev version --dry-run

# Bump everything by at least a patch, even if there are no relevant commits.
rev version --force
```

This will bump public package versions and changelogs based on commit messages since the last version.

### Commit Messages

The format is based on [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary), but is more relaxed.

Recommended Format: `<type>[scope][!]: <description>`

Rules:
- If there's an exclamation mark (`!`) after the type and scope, then it's treated as a major change, regardless of the type.
- If the type starts with `feat`, then it's treated as a minor change.
- Any other commit is treated as a patch change, even if it doesn't match the format at all.

Examples:

- `feat(parser)!: a major change because of the exclamation mark`
- `feat!: also a major change`
- `feat(parser): a minor change because the type starts with "feat"`
- `feat: also a minor change`
- `fix: a patch change`
- `also a patch change because it doesn't match the format at all`

# Beta and Alpha Versions

Version bumping will never modify the left-most zeros in a version. This means that if a package is at `0.x.x` (a beta version), then it will always stay at `0.x.x` until you manually change it to `1.0.0` or higher. If it's at `0.0.x` (an alpha version), then it will always stay at `0.0.x` until you manually change it to `0.1.0` or higher.

This is inline with the [NPM semver caret range](https://docs.npmjs.com/cli/v6/using-npm/semver#caret-ranges-123-025-004) behavior, which treats the left-most non-zero number as the "major" version.

You must manually promote a package from alpha to beta, or from beta to stable. There is no commit message format that marks a package as promotable.

# Prerelease Versions

If a version tag is present, the version is considered prerelease, and only the tag will be incremented no matter what commit messages are present. For example `2.0.0-beta.1` will be bumped to `2.0.0-beta.2`, even if there is a `feat` commit or a breaking change commit.

This is due to what prerelease versions are supposed to mean. If you've created a prerelease version (eg. `2.0.0-beta.0`), then you're stating that you are working on a future `2.0.0` release that is planned out ahead of time. You already know what the future version will be, because you know the type of changes you will be making. Therefore, any commits you make are just working towards that future version, and should not affect what that future version will be.

## Publish

Update package version using the `version` command, or some other way. Then run the `publish` command at the repo root. This will use your package manager to publish all public (non-private) package that have a new (unpublished) version.

```sh
rev publish

# Just to see what would happen, without making any changes.
rev publish --dry-run

# Extra args are passed through to the package manager.
rev publish -- --tag beta
```

Your package manager is determined automatically by looking for lock files at the repo root. Supported package managers are: `npm`, `pnpm`, and `yarn` (berry). If auto-detection doesn't work for you, you can specify the publish command manually.

```sh
rev publish --command "npm publish"

# Run a different command.
rev publish --command "npm pack"
```
