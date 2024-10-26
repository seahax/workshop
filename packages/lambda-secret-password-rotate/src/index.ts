import crypto from 'node:crypto';

import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  PutSecretValueCommand,
  SecretsManagerClient,
  UpdateSecretVersionStageCommand,
} from '@aws-sdk/client-secrets-manager';
import { type SecretsManagerRotationHandler } from 'aws-lambda';

const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
const password_chars = process.env.PASSWORD_CHARS || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
const password_length = process.env.PASSWORD_LENGTH
  ? Math.max(8, Number.parseInt(process.env.PASSWORD_LENGTH) || 0)
  : 32;

export const handler: SecretsManagerRotationHandler = async ({
  // Secret ARN.
  SecretId,
  // Secret version.
  ClientRequestToken,
  // Current step in the secret rotation request.
  Step,
}) => {
  const { RotationEnabled = false, VersionIdsToStages = {} } = await client.send(new DescribeSecretCommand({ SecretId }));

  if (!RotationEnabled) {
    throw new Error(`Secret ${SecretId} is not enabled for rotation`);
  }

  const stages = VersionIdsToStages[ClientRequestToken];

  if (stages?.includes('AWSCURRENT')) {
    return;
  }
  else if (!stages?.includes('AWSPENDING')) {
    throw new Error(`Secret ${SecretId} version ${ClientRequestToken} is not AWSPENDING.`);
  }

  switch (Step) {
    case 'createSecret': {
      return createSecret(SecretId, ClientRequestToken);
    }
    case 'setSecret': {
      // Only necessary if the secret needs to be injected into some other
      // resource or service (eg. a database).
      break;
    }
    case 'testSecret': {
      // Only necessary if `setSecret` is implemented.
      break;
    }
    case 'finishSecret': {
      return await finishSecret(SecretId, ClientRequestToken);
    }
  }
};

async function createSecret(SecretId: string, ClientRequestToken: string): Promise<void> {
  // This will throw if the secret does not have a "current" version. This
  // means that rotation cannot initialize a secret (ie. create the initial
  // version).
  await client.send(new GetSecretValueCommand({
    SecretId, VersionStage: 'AWSCURRENT',
  }));

  try {
    // No-op if the secret version already exists and is pending.
    await client.send(new GetSecretValueCommand({
      SecretId, VersionStage: 'AWSPENDING', VersionId: ClientRequestToken,
    }));

    console.log(`createSecret: Secret ${SecretId} version ${ClientRequestToken} is already AWSPENDING`);

    return;
  }
  catch (error: any) {
    if (error?.name !== 'ResourceNotFoundException') {
      throw error;
    }
  }

  const SecretString = getRandomPassword();

  await client.send(new PutSecretValueCommand({
    SecretId,
    ClientRequestToken,
    SecretString,
    VersionStages: ['AWSPENDING'],
  }));
}

async function finishSecret(SecretId: string, ClientRequestToken: string): Promise<void> {
  const currentVersion = await getCurrentVersion(SecretId);

  if (currentVersion === ClientRequestToken) {
    console.log(`finishSecret: Secret ${SecretId} version ${ClientRequestToken} is already AWSCURRENT`);
    return;
  }

  // Move the AWSCURRENT stage to the new version.
  await client.send(new UpdateSecretVersionStageCommand({
    SecretId,
    VersionStage: 'AWSCURRENT',
    MoveToVersionId: ClientRequestToken,
    RemoveFromVersionId: currentVersion,
  }));
}

async function getCurrentVersion(SecretId: string): Promise<string | undefined> {
  const { VersionIdsToStages = {} } = await client.send(new DescribeSecretCommand({ SecretId }));

  for (const [version, stages] of Object.entries(VersionIdsToStages)) {
    if (stages.includes('AWSCURRENT')) {
      return version;
    }
  }
}

function getRandomPassword(): string {
  const values = crypto.getRandomValues(new Uint16Array(password_length));
  const password = values.reduce<string>((result, value) => {
    return result + password_chars[value % password_chars.length]!;
  }, '');

  return password;
}
