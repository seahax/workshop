# @seahax/rev

Conventional(-ish) versioning tool.

## Getting Started

Run in a directory with a `package.json` or `.rev` file.

```bash
npx @seahax/rev

# Or, if installed globally...
rev
```

## Monorepos

Add a `.rev` file at the repo root. The file should contain globs which match package directories (one per line). Blank lines and lines which start with `#` are ignored.

```gitignore
# This line is a comment. The following line is a glob.
packages/*
```

If you want syntax highlighting in your IDE, associate `.rev` files with the `gitignore` file type.
