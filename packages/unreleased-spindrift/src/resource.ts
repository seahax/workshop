import { type Task, withTask } from '@seahax/main';

import { type Context } from './context.js';

interface ResourceParams {
  /**
   * Resource title to display when bringing up or tearing down components.
   */
  readonly title: string | ((command: Hook) => string);

  /**
   * Create or update components.
   */
  readonly up: (ctx: ResourceContext) => Promise<void>;

  /**
   * Delete outdated components after all `up` callbacks (for all resources)
   * have been invoked. This is called in the reverse order that the `up`
   * callbacks were called.
   */
  readonly cleanup?: (ctx: ResourceContext) => Promise<void>;

  /**
   * Delete any unused components. This is called in the reverse order that the
   * `up` callbacks were called.
   */
  readonly down?: (ctx: ResourceContext) => Promise<void>;

  /**
   * Resources which must be created before this resource.
   */
  readonly dependencies?: readonly Resource[];

  /**
   * Resources which depend on this resource.
   */
  readonly dependents?: readonly Resource[];
}

type Hook = Extract<keyof ResourceParams, 'up' | 'cleanup' | 'down'>;

export interface ResourceContext extends Context {
  readonly task: Task;
}

export interface Resource extends ResourceParams {
  readonly title: (hook: Hook) => string;
  readonly dependencies: readonly Resource[];
  readonly dependents: readonly Resource[];
}

export const RESOURCE_APP_TAG = '@seahax/engage:app';

export function createResource({ title, dependencies, dependents, ...resource }: ResourceParams): Resource {
  return {
    ...resource,
    title: typeof title === 'string'
      ? (hook) => hook === 'cleanup' ? `Cleanup > ${title}` : title
      : title,
    dependencies: dependencies ?? [],
    dependents: dependents ?? [],
  };
}

export async function applyResources(
  hook: Hook,
  ctx: Context,
  resources: readonly Resource[],
): Promise<void> {
  await applyResourcesRecursively(hook, ctx, resources, new Set());
}

async function applyResourcesRecursively(
  hook: Hook,
  ctx: Context,
  resources: readonly Resource[],
  visited: Set<Resource>,
): Promise<void> {
  if (hook !== 'up') {
    resources = [...resources].reverse();
  }

  for (const resource of resources) {
    if (visited.has(resource)) continue;

    visited.add(resource);

    if (!hasHook(resource, hook)) continue;

    const [before, after] = hook === 'up'
      ? [resource.dependencies, resource.dependents]
      : [resource.dependents, resource.dependencies];

    await withTask(resource.title(hook), async (task) => {
      await applyResourcesRecursively(hook, ctx, before, visited);
      await resource[hook]?.({ ...ctx, task });
      await applyResourcesRecursively(hook, ctx, after, visited);
    });
  }
}

function hasHook(resource: Resource, hook: Hook): boolean {
  return Boolean(
    resource[hook]
    || resource.dependencies.some((dependency) => hasHook(dependency, hook))
    || resource.dependents.some((dependent) => hasHook(dependent, hook)),
  );
}
