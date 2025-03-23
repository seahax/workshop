# @seahax/run-all

Run all package scripts with a prefix.

For example, the command `run-all test.` will run all scripts that start with `test.` in the current package.

- Supports NPM, PNPM, and Yarn.
- Must be run by a package script.
- Scripts that exactly match a prefix are not included.
- Multiple prefixes can be given.
- Scripts are run sequentially.
- Passing arguments to the scripts is not supported.
