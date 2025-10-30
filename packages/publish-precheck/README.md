# @seahax/publish-precheck

Check package.json files for problems to fix before publishing.

## Checks

Only checks packages that have a `name`, `version`, and are not marked
`private`.

- Ensure a `license` field.
- Ensure a `repository` field.
- Ensure a `files` field.
- Ensure a `bin`, `exports`, or `main` field.
  - If `exports` field exists...
    - Ensure `type` is `module`.
    - Ensure `types` field exists.
  - If `main` field exists...
    - Ensure `type` is `commonjs`.
- Ensure a `type` field exists.
  - If `type` is `module`...
    - Ensure `exports` or `bin` field exists.
    - Ensure `main` field does not exist.
  - If `type` is `commonjs`...
    - Ensure `main` or `bin` field exists.
    - Ensure `exports` field does not exist.
- Ensure no `workspace:` production dependencies.
- Ensure no `file:` production dependencies.
- Ensure no `*` production dependencies.
