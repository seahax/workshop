import { initContract } from '@ts-rest/core';

type ContractInstance = ReturnType<typeof initContract>;

const contract: ContractInstance = initContract();

/**
 * Create a new API router schema. This schema is to initialize client SDKs and
 * server routers (eg. an ExpressJS Router).
 *
 * Example:
 * ```ts
 * const routerSchema = initRouterSchema({
 *   // Router API schema...
 * });
 * ```
 *
 * Equivalent to the following `@ts-rest/core` code:
 * ```ts
 * const contract = initContract();
 * const routerSchema = c.router({
 *   // Router API schema...
 * });
 * ```
 */
export const initRouterSchema: typeof contract.router = contract.router;

/**
 * Used in an API router schema to indicate that a route accepts no body or
 * responds with no body.
 */
export const NoBody: ReturnType<ContractInstance['noBody']> = contract.noBody();
