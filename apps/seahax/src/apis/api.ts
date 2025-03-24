import { initContract as initTsRest } from '@ts-rest/core';

type TsRest = ReturnType<typeof initTsRest>;
type ApiFactory = TsRest['router'];
type NoBody = ReturnType<TsRest['noBody']>;

const rest = initTsRest();

export const initApi: ApiFactory = rest.router;
export const empty: NoBody = rest.noBody();
export const model = rest.type;
