import { initContract } from '@ts-rest/core';

export type ContractInstance = Omit<ReturnType<typeof initContract>, 'body' | 'response'>;
export const contract: ContractInstance = initContract();
