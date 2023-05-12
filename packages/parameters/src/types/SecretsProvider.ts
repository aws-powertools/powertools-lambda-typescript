import type { GetOptionsInterface, TransformOptions } from './BaseProvider';
import type {
  SecretsManagerClient,
  SecretsManagerClientConfig,
  GetSecretValueCommandInput,
} from '@aws-sdk/client-secrets-manager';

/**
 * Base interface for SecretsProviderOptions.
 *
 *  @interface
 *  @property {SecretsManagerClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 *  @property {never} [awsSdkV3Client] - This property should never be passed.
 */
interface SecretsProviderOptionsWithClientConfig {
  clientConfig?: SecretsManagerClientConfig;
  awsSdkV3Client?: never;
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
  awsSdkV3Client?: SecretsManagerClient;
  clientConfig?: never;
}

/**
 * Options for the SecretsProvider class constructor.
 *
 * @type SecretsProviderOptions
 * @property {AppConfigDataClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with awsSdkV3Client.
 * @property {AppConfigDataClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during SecretsProvider class instantiation. Mutually exclusive with clientConfig.
 */
type SecretsProviderOptions =
  | SecretsProviderOptionsWithClientConfig
  | SecretsProviderOptionsWithClientInstance;

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
interface SecretsGetOptions extends GetOptionsInterface {
  /**
   * Additional options to pass to the AWS SDK v3 client. Supports all options from `GetSecretValueCommandInput`.
   */
  sdkOptions?: Omit<Partial<GetSecretValueCommandInput>, 'SecretId'>;
  transform?: Exclude<TransformOptions, 'auto'>;
}

interface SecretsGetOptionsTransformJson extends SecretsGetOptions {
  transform: 'json';
}

interface SecretsGetOptionsTransformBinary extends SecretsGetOptions {
  transform: 'binary';
}

interface SecretsGetOptionsTransformNone extends SecretsGetOptions {
  transform?: never;
}

type SecretsGetOptionsUnion =
  | SecretsGetOptionsTransformNone
  | SecretsGetOptionsTransformJson
  | SecretsGetOptionsTransformBinary
  | undefined;

/**
 * Generic output type for the SecretsProvider get method.
 */
type SecretsGetOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined
> = undefined extends ExplicitUserProvidedType
  ? undefined extends InferredFromOptionsType
    ? string | Uint8Array
    : InferredFromOptionsType extends SecretsGetOptionsTransformNone
    ? string | Uint8Array
    : InferredFromOptionsType extends SecretsGetOptionsTransformBinary
    ? string
    : InferredFromOptionsType extends SecretsGetOptionsTransformJson
    ? Record<string, unknown>
    : never
  : ExplicitUserProvidedType;

export type {
  SecretsProviderOptions,
  SecretsGetOptions,
  SecretsGetOutput,
  SecretsGetOptionsUnion,
};
