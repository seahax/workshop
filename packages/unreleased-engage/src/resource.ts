import { type Context } from './context.js';
import { spinner } from './utils/spinner.js';

type Method<
  TContext extends Context,
  TParams extends object | void,
  TResult,
> = (ctx: TContext, ...args: TParams extends void
  ? []
  : object extends TParams
    ? [params?: TParams]
    : [params: TParams]
) => Promise<TResult>;

type GetResult<TResult extends object | void> = TResult extends void ? object : {
  [P in keyof TResult]: TResult[P] | null;
};

type ResourceHooks<
  TResult extends object | void,
  TUpParams extends object | void,
  TDownParams extends object | void,
  TGetParams extends object | void,
> = {
  up: Method<Context, TUpParams, TResult>;
  down?: Method<Context, TDownParams, void>;
  get?: Method<Context, TGetParams, GetResult<NoInfer<TResult>> | undefined>;
} & (
  TResult extends void
    ? { get?: Method<Context, TGetParams, GetResult<NoInfer<TResult>>> }
    : { get: Method<Context, TGetParams, GetResult<NoInfer<TResult>>> }
);

export interface Resource<
  TResult extends object | void,
  TUpParams extends object | void,
  TDownParams extends object | void,
  TGetParams extends object | void,
> {
  up: Method<Context, TUpParams, TResult>;
  down: Method<Context, TDownParams, void>;
  get: Method<Context, TGetParams, TResult extends void ? object : GetResult<NoInfer<TResult>>>;
}

export function createResource<
  TResult extends object | void,
  TUpParams extends object | void = void,
  TDownParams extends object | void = void,
  TGetParams extends object | void = void,
>(
  name: string,
  resource: ResourceHooks<TResult, TUpParams, TDownParams, TGetParams>,
): Resource<TResult, TUpParams, TDownParams, TGetParams> {
  return {
    async up(ctx, ...args) {
      spinner.suffixText = '';
      spinner.start(name);

      try {
        const result = await resource.up(ctx, ...args);
        spinner.suffixText = '';
        spinner.succeed();
        return result;
      }
      catch (error: unknown) {
        spinner.fail();
        spinner.suffixText = '';
        throw error;
      }
    },

    async down(ctx, ...args) {
      if (!resource.down) return;

      spinner.suffixText = '';
      spinner.start(name);

      try {
        await resource.down(ctx, ...args);
        spinner.suffixText = '';
        spinner.succeed();
      }
      catch (error: unknown) {
        spinner.fail();
        spinner.suffixText = '';
        throw error;
      }
    },

    async get(ctx, ...args) {
      return await resource.get?.(ctx, ...args) ?? {} as any;
    },
  };
}
