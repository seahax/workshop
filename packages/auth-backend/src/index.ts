import { type APIGatewayProxyEventV2, type Handler } from 'aws-lambda';

export const handler: Handler<APIGatewayProxyEventV2> = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'This endpoint has not been implemented yet.' }),
  };
};
