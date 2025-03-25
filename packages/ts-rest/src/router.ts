import { initContract } from '@ts-rest/core';

type ContractInstance = ReturnType<typeof initContract>;

const contract: ContractInstance = initContract();

/**
 * Create a new API router spec. This spec is to initialize client SDKs and
 * server routers (eg. an ExpressJS Router).
 *
 * Example:
 * ```ts
 * const routerSpec = initRouterSpec({
 *   // Router API spec...
 * });
 * ```
 *
 * Equivalent to the following `@ts-rest/core` code:
 * ```ts
 * const contract = initContract();
 * const routerSpec = c.router({
 *   // Router API spec...
 * });
 * ```
 */
export const initRouterSpec: typeof contract.router = contract.router;

/**
 * Define a type only schema for ts-rest. This should be used instead of a Zod
 * schema when runtime validation is not necessary. For instance, validating
 * response bodies in the client is generally unnecessary extra overhead when
 * using TypeScript.
 */
export const schema = contract.type;

/**
 * A special ts-rest schema used to indicate a response or request body that is
 * empty.
 */
export const $Empty: ReturnType<ContractInstance['noBody']> = contract.noBody();
