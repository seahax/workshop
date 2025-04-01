import type { z } from 'zod';

const ZOD_CODEC_SCHEMA = Symbol('ZodCodecSchema');

export type ZodCodecSchema<T> = z.ZodType<T> & {
  [ZOD_CODEC_SCHEMA]: unknown;
};

export interface ZodCodec<TEncoded, TDecoded> {
  /**
   * Zod schema which parses an "encoded" value of the paired `encoded` schema
   * type, and transforms (ie. decodes) it into this type.
   */
  readonly decoded: ZodCodecSchema<TDecoded>;
  /**
   * Zod schema which parses a "decoded" value of the paired `decoded` schema
   * type, and transforms (ie. encodes) it into this type.
   */
  readonly encoded: ZodCodecSchema<TEncoded>;
}

export interface ZodCodecConfig<
  TEncoded extends z.ZodTypeAny,
  TDecoded extends z.ZodTypeAny,
> {
  /**
   * Zod schema for the encoded value.
   */
  readonly encoded: TEncoded;
  /**
   * Zod schema for the decoded value.
   */
  readonly decoded: TDecoded;
  /**
   * Transform an unencoded (decoded) value to an encoded value.
   */
  readonly encode: (value: z.infer<TDecoded>) => z.infer<TEncoded>;
  /**
   * Transform an encoded value to an unencoded (decoded) value.
   */
  readonly decode: (value: z.infer<TEncoded>) => z.infer<TDecoded>;
}

/**
 * Create a pair of Zod schemas with reciprocal transformations.
 *
 * The two schemas are reciprocal because:
 * - The returned `encoded` schema parses the `decoded` schema type and
 *   transforms it to the `encoded` schema type.
 * - The returned `decoded` schema parses the `encoded` schema type and
 *   transforms it to the `decoded` schema type.
 */
export default function zodCodec<TEncoded extends z.ZodTypeAny, TDecoded extends z.ZodTypeAny>(
  options: ZodCodecConfig<TEncoded, TDecoded>,
): ZodCodec<z.infer<TEncoded>, z.infer<TDecoded>> {
  return {
    decoded: Object.assign(options.encoded.transform((value) => options.decoded.parse(options.decode(value))), {
      [ZOD_CODEC_SCHEMA]: true,
    }),
    encoded: Object.assign(options.decoded.transform((value) => options.encoded.parse(options.encode(value))), {
      [ZOD_CODEC_SCHEMA]: true,
    }),
  };
}
