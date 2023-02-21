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

/**
 * Options to configure the SecretsProvider.
 */
type SecretsProviderOptions = SecretsProviderOptionsWithClientConfig | SecretsProviderOptionsWithClientInstance;

/**
 * Options to configure the retrieval of a secret.
 * 
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {Omit<Partial<GetSecretValueCommandInput>, 'SecretId'>} sdkOptions - Options to pass to the underlying SDK.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 */
interface SecretsGetOptionsInterface extends GetOptionsInterface {
  sdkOptions?: Omit<Partial<GetSecretValueCommandInput>, 'SecretId'>
}

export type {
  SecretsProviderOptions,
  SecretsGetOptionsInterface,
};