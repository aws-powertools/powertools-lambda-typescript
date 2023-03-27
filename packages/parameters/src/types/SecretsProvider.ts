import type { GetOptionsInterface } from './BaseProvider';
import type { SecretsManagerClient, SecretsManagerClientConfig, GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';

/**
 * Base interface for SecretsProviderOptions.
 *
 *  @interface
 *  @property {SecretsManagerClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 *  @property {never} [awsSdkV3Client] - This property should never be passed.
 */
interface SecretsProviderOptionsWithClientConfig {
  clientConfig?: SecretsManagerClientConfig
  awsSdkV3Client?: never
}

/**
 * Interface for SecretsProviderOptions with awsSdkV3Client property.
 *
 *  @interface
 *  @extends SecretsProviderOptionsWithClientConfig
 *  @property {SecretsManagerClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during SecretsProvider class instantiation
 *  @property {never} [clientConfig] - This property should never be passed.
 */
interface SecretsProviderOptionsWithClientInstance {
  awsSdkV3Client?: SecretsManagerClient
  clientConfig?: never
}

/**
 * Options for the SecretsProvider class constructor.
 *
 * @type SecretsProviderOptions
 * @property {AppConfigDataClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with awsSdkV3Client.
 * @property {AppConfigDataClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during SecretsProvider class instantiation. Mutually exclusive with clientConfig.
 */
type SecretsProviderOptions = SecretsProviderOptionsWithClientConfig | SecretsProviderOptionsWithClientInstance;

/**
 * Options to configure the retrieval of a secret.
 * 
 * @interface SecretsGetOptionsInterface
 * @extends {GetOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {GetSecretValueCommandInput} sdkOptions - Options to pass to the underlying SDK.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 */
interface SecretsGetOptionsInterface extends GetOptionsInterface {
  sdkOptions?: Omit<Partial<GetSecretValueCommandInput>, 'SecretId'>
}

export type {
  SecretsProviderOptions,
  SecretsGetOptionsInterface,
};