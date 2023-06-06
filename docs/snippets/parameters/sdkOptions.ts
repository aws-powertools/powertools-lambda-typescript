import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';

const secretsProvider = new SecretsProvider();

export const handler = async (): Promise<void> => {
  const sdkOptions: Partial<GetSecretValueCommandInput> = {
    VersionId: 'e62ec170-6b01-48c7-94f3-d7497851a8d2',
  };
  /**
   * The 'VersionId' argument will be passed to the underlying
   * `GetSecretValueCommand` call.
   */
  const secret = await secretsProvider.get('my-secret', { sdkOptions });
  console.log(secret);
};
