# @seahax/publish-from-package

Recursively publish new public package versions.

## Usage

1. Update some package versions.
2. Execute this tool at the repo root.

```sh
# Publish new package versions.
npx @seahax/publish-from-package

# Just to see what would happen, without making any changes.
npx @seahax/publish-from-package --dry-run

# Extra args are passed through to the package manager.
npx @seahax/publish-from-package -- --tag beta
```

Your package manager is determined automatically by looking for lock files at the repo root. Supported package managers are: `npm`, `pnpm`, and `yarn` (berry).

If auto-detection doesn't work for you, you can specify the publish command manually.

```sh
npx @seahax/publish-from-package --command "npm publish"

# Run a different command.
npx @seahax/publish-from-package --command "npm pack"
```
