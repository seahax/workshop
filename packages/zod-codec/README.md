# @seahax/zod-codec

Bi-directional transformation between two Zod schemas (ie. codec, encode and decode).

## Example

Declare a codec which translates bi-directionally between a `Date` and a `string` in ISO format.

```ts
import { zodCodec } from '@seahax/zod-codec';

const codec = zodCodec({
  encoded: z.instanceof(Date),
  decoded: z.string().datetime(),
  encode: (decoded) => Date.parse(decoded),
  decode: (encoded) => encoded.toISOString(),
});
```

Use the codec to transform (encode/decode) dates to strings and vice versa.

```ts
const date: Date = codec.encode('2023-01-01T00:00:00Z');
const isoString: string = codec.decode(date);
```
