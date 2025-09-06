# @seahax/run-all

Because life's too short to type `npm run test.unit && npm run test.integration && npm run test.e2e` when you could just say `run-all test.`.

- Supports NPM, PNPM, and Yarn.
- Must be run by a package script.
- Scripts that exactly match a prefix are not included.
- Multiple prefixes can be given.
- Scripts are run sequentially.
- Passing arguments to the scripts is not supported.


