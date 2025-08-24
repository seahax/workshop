type DependencyValues<TDependencies> = (
  TDependencies extends readonly [infer TFirst, ...infer TRest]
    ? [
        TFirst extends Service<any, infer TValue> ? TValue : never,
        ...DependencyValues<TRest>,
      ]
    : []
);

export interface Service<TScope extends WeakKey | undefined, TValue> {
  resolve(...args: undefined extends TScope ? [scope?: TScope] : [scope: TScope]): TValue;
  isResolved(...args: undefined extends TScope ? [scope?: TScope] : [scope: TScope]): boolean;
  reset(...args: undefined extends TScope ? [scope?: TScope] : [scope: TScope]): void;
  resetAll(): void;
}

export interface ServiceBuilder<
  TScope extends WeakKey | undefined,
  TDependencies extends readonly Service<TScope, unknown>[],
> {
  /**
   * Add a service dependency.
   */
  use<TDependency extends Service<TScope, unknown>>(
    dependency: TDependency
  ): ServiceBuilder<TScope, readonly [...TDependencies, TDependency]>;
  /**
   * Build the service using a provider function.
   */
  build<TValue>(provider: ServiceProvider<TScope, TDependencies, TValue>): Service<TScope, TValue>;
}

export type ServiceProvider<
  TScope extends WeakKey | undefined,
  TDependencies extends readonly Service<TScope, unknown>[],
  TValue,
> = (this: Service<TScope, TValue>, ...dependencies: DependencyValues<TDependencies>) => TValue;

/**
 * Create a new service builder.
 */
export function service<TScope extends WeakKey | undefined>(): ServiceBuilder<TScope, []> {
  function next<TDependencies extends readonly Service<TScope, unknown>[]>(
    dependencies: TDependencies,
  ): ServiceBuilder<TScope, TDependencies> {
    return {
      use: (dependency) => next([...dependencies, dependency]),
      build<TValue>(provider: ServiceProvider<TScope, TDependencies, TValue>) {
        let instances = new WeakMap<WeakKey, { readonly value: TValue }>();

        const self: Service<TScope, TValue> = {
          resolve: (scope: TScope = undefined as TScope) => {
            let entry = instances.get(scope ?? DEFAULT_SCOPE);

            if (!entry) {
              const dependencyValues = dependencies.map((dependency) => {
                return dependency.resolve(scope);
              }) as DependencyValues<TDependencies>;

              entry = { value: provider.call(self, ...dependencyValues) };
            }

            return entry.value;
          },
          isResolved: (scope = DEFAULT_SCOPE as TScope & {}) => {
            return instances.has(scope);
          },
          reset: (scope = DEFAULT_SCOPE as TScope & {}) => {
            instances.delete(scope);
          },
          resetAll: () => {
            instances = new WeakMap();
          },
        };

        return self;
      },
    };
  }

  return next([]);
}

/**
 * A special service that injects the scope used to resolve the service.
 */
export function serviceScope<TScope extends WeakKey | undefined>(): Service<TScope, TScope> {
  return {
    resolve: (scope: TScope = undefined as TScope) => scope,
    isResolved: () => true,
    reset: () => void 0,
    resetAll: () => void 0,
  };
};

const DEFAULT_SCOPE = Symbol();
