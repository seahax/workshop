# @seahax/ts-rest-client

TSRest client with better defaults and improved response validation.

- Throw an invalid URL error it the base URL is not fully qualified (absolute).
  - Base URL can be a `URL` instance instead of a string.
- Response validation by default.
  - Response content-type is validated.
  - Applies to content-types other than JSON.
- Throw errors on unknown status codes by default (if the routes contract `strictStatusCodes` option is `true`).
