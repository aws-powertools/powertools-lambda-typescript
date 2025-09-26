import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type {
  GetSecretValueCommandInput,
  SecretsManagerClient,
  SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';
import type { SecretsProvider } from '../secrets/SecretsProvider.js';
import type { GetOptionsInterface, TransformOptions } from './BaseProvider.js';

/**
 * Base interface for {@link SecretsProviderOptions | SecretsProviderOptions}.
 *
 * @property clientConfig - Optional configuration to pass during client initialization, e.g. AWS region.
 * @property awsSdkV3Client - This property should never be passed.
 */
interface SecretsProviderOptionsWithClientConfig {
  /**
   * Optional configuration to pass during client initialization, e.g. AWS region. Accepts the same configuration object as the AWS SDK v3 client ({@link SecretsManagerClientConfig | `SecretsManagerClientConfig`}).
   */
  clientConfig?: SecretsManagerClientConfig;
  awsSdkV3Client?: never;
}

/**
 * Interface for {@link SecretsProviderOptions | SecretsProviderOptions} with `awsSdkV3Client` property.
 *
 * @property awsSdkV3Client - Optional AWS SDK v3 client to pass during {@link SecretsProvider | `SecretsProvider`} class instantiation
 * @property clientConfig - This property should never be passed.
 */
interface SecretsProviderOptionsWithClientInstance {
  /**
   * Optional AWS SDK v3 client instance ({@link SecretsManagerClient | `SecretsManagerClient`}) to use for Secrets Manager operations. If not provided, we will create a new instance of the client.
   */
  awsSdkV3Client?: SecretsManagerClient;
  clientConfig?: never;
}

/**
 * Options for the SecretsProvider class constructor.
 *
 * @property clientConfig - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with `awsSdkV3Client`.
 * @property awsSdkV3Client - Optional AWS SDK v3 client to pass during {@link SecretsProvider | `SecretsProvider`} class instantiation. Mutually exclusive with `clientConfig`.
 */
type SecretsProviderOptions =
  | SecretsProviderOptionsWithClientConfig
  | SecretsProviderOptionsWithClientInstance;

/**
 * Options to configure the retrieval of a secret.
 *
 * @property maxAge - Maximum age of the value in the cache, in seconds.
 * @property forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property sdkOptions - Options to pass to the underlying SDK, supports all options from {@link GetSecretValueCommandInput | `GetSecretValueCommandInput`} except `SecretId`.
 * @property transform - Transform to be applied, can be 'json' or 'binary'.
 */
interface SecretsGetOptionsBase extends GetOptionsInterface {
  /**
   * Additional options to pass to the AWS SDK v3 client. Supports all options from {@link GetSecretValueCommandInput | `GetSecretValueCommandInput`} except `SecretId`.
   */
  sdkOptions?: Omit<Partial<GetSecretValueCommandInput>, 'SecretId'>;
  /**
   * Transform to be applied, can be `json` or `binary`.
   */
  transform?: Exclude<TransformOptions, 'auto'>;
}

interface SecretsGetOptionsTransformJson extends SecretsGetOptionsBase {
  transform: 'json';
}

interface SecretsGetOptionsTransformBinary extends SecretsGetOptionsBase {
  transform: 'binary';
}

interface SecretsGetOptionsTransformNone extends SecretsGetOptionsBase {
  transform?: never;
}

type SecretsGetOptions =
  | SecretsGetOptionsTransformNone
  | SecretsGetOptionsTransformJson
  | SecretsGetOptionsTransformBinary
  | undefined;

/**
 * Generic output type for the {@link SecretsProvider.get | `SecretsProvider.get()`} method.
 */
type SecretsGetOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined,
> = undefined extends ExplicitUserProvidedType
  ? undefined extends InferredFromOptionsType
    ? string | Uint8Array
    : InferredFromOptionsType extends SecretsGetOptionsTransformNone
      ? string | Uint8Array
      : InferredFromOptionsType extends SecretsGetOptionsTransformBinary
        ? string
        : InferredFromOptionsType extends SecretsGetOptionsTransformJson
          ? JSONValue
          : never
  : ExplicitUserProvidedType;

export type { SecretsProviderOptions, SecretsGetOptions, SecretsGetOutput };
