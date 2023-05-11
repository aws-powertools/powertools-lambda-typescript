import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import type { SecretsManagerClientConfig } from '@aws-sdk/client-secrets-manager';

const clientConfig: SecretsManagerClientConfig = { region: 'us-east-1' };
const secretsProvider = new SecretsProvider({ clientConfig });

export const handler = async (): Promise<void> => {
  // Retrieve a single secret
  const secret = await secretsProvider.get('my-secret');
  console.log(secret);
};
