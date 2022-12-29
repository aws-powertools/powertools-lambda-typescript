import type { GetOptionsInterface } from './BaseProvider';
import type { SecretsManagerClientConfig, GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';

interface SecretsProviderOptions {
  clientConfig?: SecretsManagerClientConfig
}

interface SecretsGetOptionsInterface extends GetOptionsInterface {
  sdkOptions?: Omit<Partial<GetSecretValueCommandInput>, 'SecretId'>
}

export type {
  SecretsProviderOptions,
  SecretsGetOptionsInterface,
};