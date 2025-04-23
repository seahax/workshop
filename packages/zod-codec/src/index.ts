import type { z } from 'zod';

export interface ZodCodecType<TInputType extends z.ZodTypeAny, TOutput> extends z.ZodEffects<TInputType, TOutput> {
  readonly input: TInputType;
};

export interface ZodCodecEntry<TInputType extends z.ZodTypeAny, TOutput> {
  readonly input: TInputType;
  readonly transform: (value: z.infer<TInputType>) => TOutput;
}

export type ZodCodecPair<T0 extends z.ZodTypeAny, T1 extends z.ZodTypeAny> = readonly [
  ZodCodecType<T0, z.infer<T1>>,
  ZodCodecType<T1, z.infer<T0>>,
];

export function zodCodec<T0 extends z.ZodTypeAny, T1 extends z.ZodTypeAny>(...[entry0, entry1]: [
  ZodCodecEntry<T0, NoInfer<z.infer<T1>>>,
  ZodCodecEntry<T1, NoInfer<z.infer<T0>>>,
]): ZodCodecPair<T0, T1> {
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
