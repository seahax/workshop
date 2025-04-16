import type { z } from 'zod';

export interface ZodCodecType<TInput, TOutput> extends z.ZodEffects<z.ZodType<TInput>, TOutput> {
  readonly input: z.ZodType<TInput>;
};

export interface ZodCodecEntry<TInput, TOutput> {
  readonly input: z.ZodType<TInput>;
  readonly transform: (value: TInput) => TOutput;
}

export type ZodCodecPair<T0, T1> = readonly [
  ZodCodecType<T0, T1>,
  ZodCodecType<T1, T0>,
];

export function zodCodec<T0, T1>(
  ...[entry0, entry1]: [ZodCodecEntry<T0, NoInfer<T1>>, ZodCodecEntry<T1, NoInfer<T0>>]
): ZodCodecPair<T0, T1> {
  return [
    Object.assign(
      entry0.input.transform((input) => entry1.input.parse(entry0.transform(input))),
      { input: entry0.input },
    ),
    Object.assign(
      entry1.input.transform((input) => entry0.input.parse(entry1.transform(input))),
      { input: entry1.input },
    ),
  ];
}
