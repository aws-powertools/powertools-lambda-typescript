import type { TransformOptions } from './BaseProvider';
import type { SecretsManagerClientConfig, GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';

// TODO: move this to BaseProvider.ts
interface GetBaseOptionsInterface {
  maxAge?: number
  forceFetch?: boolean
  decrypt?: boolean
  transform?: TransformOptions
}

interface SecretsProviderOptions {
  clientConfig?: SecretsManagerClientConfig
}

interface SecretsGetOptionsInterface extends GetBaseOptionsInterface {
  sdkOptions?: Omit<Partial<GetSecretValueCommandInput>, 'SecretId'>
}

export type {
  SecretsProviderOptions,
  SecretsGetOptionsInterface,
};