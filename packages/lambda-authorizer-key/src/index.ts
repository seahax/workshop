import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { type APIGatewayRequestSimpleAuthorizerHandlerV2 } from 'aws-lambda';

const client = new SecretsManagerClient();

export const handler: APIGatewayRequestSimpleAuthorizerHandlerV2 = async (event) => {
  if (!process.env.SECRET_ID) {
    throw new Error('SECRET_ID environment variable is required');
  }

  const key = event.headers?.['X-Api-Authorizer-Key'];

  return {
    isAuthorized: Boolean(key && await isValidKey(process.env.SECRET_ID, key)),
  };
};

const isValidKey = async (SecretId: string, value: string): Promise<boolean> => {
  for (const stage of ['AWSCURRENT', 'AWSPENDING']) {
    const current = await client.send(new GetSecretValueCommand({ SecretId, VersionStage: stage }));

    if (current.SecretString === value) {
      return true;
    }
  }

  return false;
};
