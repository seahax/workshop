import { type Context } from './context.js';
import { spinner } from './utils/spinner.js';

type Method<TParams extends object | void, TResult> = (ctx: Context, ...args: TParams extends void
  ? []
  : object extends TParams
    ? [params?: TParams]
    : [params: TParams]
) => Promise<TResult>;

interface ResourceHooks<
  TResult extends object | void,
  TUpParams extends object | void,
  TDownParams extends object | void,
  TGetParams extends object | void,
> {
  up: Method<TUpParams, TResult>;
  down?: Method<TDownParams, void>;
  get?: Method<TGetParams, Partial<NoInfer<TResult>> | undefined>;
}

export interface Resource<
  TResult extends object | void,
  TUpParams extends object | void,
  TDownParams extends object | void,
  TGetParams extends object | void,
> {
  up: Method<TUpParams, TResult>;
  down: Method<TDownParams, void>;
  get: Method<TGetParams, TGetParams extends void ? object : Partial<NoInfer<TResult>>>;
}

export function createResource<
  TResult extends object | void,
  TUpParams extends object | void = void,
  TDownParams extends object | void = void,
  TGetParams extends object | void = void,
>(
  name: string,
  resource: ResourceHooks<TUpParams, TDownParams, TGetParams, TResult>,
): Resource<TUpParams, TDownParams, TGetParams, TResult> {
  return {
    async up(ctx: Context, ...args) {
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
      return await resource.get?.(ctx, ...args) ?? {};
    },
  };
}
