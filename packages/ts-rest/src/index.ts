import {
  type AppRouteMutation,
  type AppRouteQuery,
  type ContractAnyType,
  type ContractOtherResponse,
  initContract,
  isAppRouteOtherResponse,
} from '@ts-rest/core';

type ContractInstance = Omit<ReturnType<typeof initContract>, 'body' | 'response'>;

export interface TsRestResponse<T extends ContractAnyType> extends ContractOtherResponse<T> {
  /**
   * The content-type header of the response. Defaults to `application/json`.
   */
  contentType: string;
  /**
   * The body schema (aka: type, contract) of the response.
   */
  body: T;
}

export interface TsRest {
  /**
   * Define a collection of routes (aka: endpoints, an API contract).
   */
  routes: ContractInstance['router'];
  /**
   * Define a single route (aka: an endpoint).
   */
  route: ContractInstance['query'] & ContractInstance['mutation'];
  /**
   * Define a set of response statuses and their corresponding response
   * schemas.
   */
  responses: ContractInstance['responses'];
  /**
   * Define a single response schema.
   */
  response: <T extends ContractAnyType | TsRestResponse<ContractAnyType>>(response: T) => T;
  /**
   * Defines a simple type _without_ parsing/validation. This can be used in
   * place of a Zod type when parsing is not necessary, or in cases where a
   * Zod type cannot represent the type (eg. a body-less request or response).
   */
  type: ContractInstance['type'];
  /**
   * A special type that indicates a request or response body is not expected.
   */
  noBody: ContractInstance['noBody'];
}

const contract = initContract();
const TsRest: TsRest = {
  routes: contract.router,
  route: <T extends AppRouteQuery | AppRouteMutation>(route: T): (AppRouteQuery | AppRouteMutation) & T => {
    return route.method === 'GET' ? contract.query(route) : contract.mutation(route);
  },
  responses: contract.responses,
  response: <T extends ContractAnyType | TsRestResponse<ContractAnyType>>(response: T): T => {
    return isAppRouteOtherResponse(response) ? contract.otherResponse(response) as T : response;
  },
  type: contract.type,
  noBody: contract.noBody,
};

export default TsRest;
