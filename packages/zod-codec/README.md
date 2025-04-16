# @seahax/zod-codec

Bi-directional transformation between two Zod schemas (ie. encode and decode, codec).

## Example

Declare a codec which translates bi-directionally between a `Date` and a `string` in ISO format.

```ts
import { zodCodec } from '@seahax/zod-codec';

const [DATE, DATE_STRING] = zodCodec(
  {
    input: z.instanceof(Date),
    transform: (input) => {
      // The input is typed as Date.
      // The return type must be the other input type (ISO datetime string).
      return input.toISOString();
    },
  },
  {
    input: z.string().datetime(),
    transform: (input) => {
      // The input is typed as an ISO datetime string.
      // The return type must be the other input type (Date).
      return Date.parse(input)
    },
  },
});
```

Use the codec to transform (encode/decode) dates to strings and vice versa.

```ts
const date: Date = DATE.parse('2023-01-01T00:00:00Z');
const dateString: string = DATE_STRING.parse(date);
```
