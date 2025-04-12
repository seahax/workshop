# @seahax/ts-rest-client

TSRest client with better defaults and improved response validation.

- Response validation by default.
  - Response content-type is validated.
  - Applies to content-types other than JSON.
- Throw errors on unknown status codes by default (if the contract/router `strictStatusCodes` option is `true`).
