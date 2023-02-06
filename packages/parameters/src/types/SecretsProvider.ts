import type { GetOptionsInterface } from './BaseProvider';
import type { SecretsManagerClient, SecretsManagerClientConfig, GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';

interface SecretsProviderOptionsWithClientConfig {
  clientConfig?: SecretsManagerClientConfig
  awsSdkV3Client?: never
}

interface SecretsProviderOptionsWithClientInstance {
  awsSdkV3Client?: SecretsManagerClient
  clientConfig?: never
}

type SecretsProviderOptions = SecretsProviderOptionsWithClientConfig | SecretsProviderOptionsWithClientInstance;

interface SecretsGetOptionsInterface extends GetOptionsInterface {
  sdkOptions?: Omit<Partial<GetSecretValueCommandInput>, 'SecretId'>
}

export type {
  SecretsProviderOptions,
  SecretsGetOptionsInterface,
};