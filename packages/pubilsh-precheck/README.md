# @seahax/wscheck

Check package.json files for problems to fix before publishing.

## Checks

Only checks packages that have a `name`, `version`, and are not marked
`private`.

- Ensure a `license` field.
- Ensure a `repository` field.
- Ensure a `files` field.
- Ensure a `bin`, `exports`, or `main` field.
- Ensure a `types` field.
- Ensure `type` of `module` has an `exports` or `bin` field.
- Ensure `type` of `module` if `exports` field exists.
- Ensure `type` of `module` does not have a `main` field.
- Ensure `type` of `commonjs` has a `main` or `bin` field.
- Ensure `type` of `commonjs` if `main` field exists.
- Ensure `type` of `commonjs` does not have an `exports` field.
- Ensure all packages have a `types` field if they also have an `exports` field.
- Ensure no `workspace:` production dependencies.
- Ensure no `file:` production dependencies.
- Ensure no `*` production dependencies.
