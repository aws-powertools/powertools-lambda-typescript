import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

// construct your clients with any custom configuration
const secretsManagerClient = new SecretsManagerClient({ region: 'us-east-1' });
// pass the client to the provider
const secretsProvider = new SecretsProvider({
  awsSdkV3Client: secretsManagerClient,
});

export const handler = async (): Promise<void> => {
  // Retrieve a single secret
  const secret = await secretsProvider.get('my-secret');
  console.log(secret);
};
