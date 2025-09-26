import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type {
  AppConfigDataClient,
  AppConfigDataClientConfig,
  StartConfigurationSessionCommandInput,
} from '@aws-sdk/client-appconfigdata';
import type { AppConfigProvider } from '../appconfig/AppConfigProvider.js';
import type { getAppConfig } from '../appconfig/getAppConfig.js';
import type { GetOptionsInterface } from './BaseProvider.js';

/**
 * Base interface for {@link AppConfigProviderOptions | `AppConfigProviderOptions`}.
 *
 * @property environment - The environment ID or the environment name.
 * @property application - The optional application ID or the application name.
 */
interface AppConfigProviderOptionsBaseInterface {
  /**
   * The environment ID or the environment name.
   */
  environment: string;
  /** The optional application ID or the application name.
   */
  application?: string;
}

/**
 * Interface for {@link AppConfigProviderOptions | `AppConfigProviderOptions`} with `clientConfig` property.
 *
 * @property clientConfig - Optional configuration to pass during client initialization, e.g. AWS region.
 * @property awsSdkV3Client - This property should never be passed when using `clientConfig`.
 */
interface AppConfigProviderOptionsWithClientConfig
  extends AppConfigProviderOptionsBaseInterface {
  /**
   * Optional configuration to pass during client initialization, e.g. AWS region. Accepts the same configuration object as the AWS SDK v3 client ({@link AppConfigDataClientConfig | `AppConfigDataClientConfig`}).
   */
  clientConfig?: AppConfigDataClientConfig;
  /**
   * This property should never be passed when using `clientConfig`.
   */
  awsSdkV3Client?: never;
}

/**
 * Interface for {@link AppConfigProviderOptions | `AppConfigProviderOptions`} with awsSdkV3Client property.
 *
 * @property awsSdkV3Client - Optional AWS SDK v3 client to pass during the `AppConfigProvider` class instantiation, should be an instance of {@link AppConfigDataClient | `AppConfigDataClient`}.
 * @property clientConfig - This property should never be passed when using `awsSdkV3Client`.
 */
interface AppConfigProviderOptionsWithClientInstance
  extends AppConfigProviderOptionsBaseInterface {
  /**
   * Optional AWS SDK v3 client instance ({@link AppConfigDataClient | `AppConfigDataClient`}) to use for AppConfig operations. If not provided, we will create a new instance of the client.
   */
  awsSdkV3Client?: AppConfigDataClient;
  /**
   * This property should never be passed when using `awsSdkV3Client`.
   */
  clientConfig?: never;
}

/**
 * Options for the `AppConfigProvider` class constructor.
 *
 * @property environment - The environment ID or the environment name.
 * @property application - Optional application ID or the application name, if not provided it will be inferred from the service name in the environment.
 * @property clientConfig - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with `awsSdkV3Client`. Accepts the same configuration object as the AWS SDK v3 client ({@link AppConfigDataClientConfig | `AppConfigDataClientConfig`}).
 * @property awsSdkV3Client - Optional ({@link AppConfigDataClient | `AppConfigDataClient`}) instance to pass during `AppConfigProvider` class instantiation. Mutually exclusive with `clientConfig`.
 */
type AppConfigProviderOptions =
  | AppConfigProviderOptionsWithClientConfig
  | AppConfigProviderOptionsWithClientInstance;

/**
 * Options for the {@link AppConfigProvider.get | `AppConfigProvider.get()`} method.
 *
 * @property maxAge - Maximum age of the value in the cache, in seconds.
 * @property forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property sdkOptions - Additional options to pass to the AWS SDK v3 client. Supports all options from {@link StartConfigurationSessionCommandInput | `StartConfigurationSessionCommandInput`} except `ApplicationIdentifier`, `EnvironmentIdentifier`, and `ConfigurationProfileIdentifier`.
 * @property transform - Optional transform to be applied, can be 'json' or 'binary'.
 */
interface AppConfigGetOptionsBase extends GetOptionsInterface {
  /**
   * Additional options to pass to the AWS SDK v3 client. Supports all options from {@link StartConfigurationSessionCommandInput | `StartConfigurationSessionCommandInput`} except `ApplicationIdentifier`, `EnvironmentIdentifier`, and `ConfigurationProfileIdentifier`.
   */
  sdkOptions?: Omit<
    Partial<StartConfigurationSessionCommandInput>,
    | 'ApplicationIdentifier'
    | 'EnvironmentIdentifier'
    | 'ConfigurationProfileIdentifier'
  >;
}

interface AppConfigGetOptionsTransformJson extends AppConfigGetOptionsBase {
  transform: 'json';
}

interface AppConfigGetOptionsTransformBinary extends AppConfigGetOptionsBase {
  transform: 'binary';
}

interface AppConfigGetOptionsTransformNone extends AppConfigGetOptionsBase {
  transform?: never;
}

/**
 * Options for the {@link AppConfigProvider.get | `AppConfigProvider.get()`} method.
 *
 * @property maxAge - Maximum age of the value in the cache, in seconds.
 * @property forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property sdkOptions - Additional options to pass to the AWS SDK v3 client. Supports all options from {@link StartConfigurationSessionCommandInput | `StartConfigurationSessionCommandInput`} except `ApplicationIdentifier`, `EnvironmentIdentifier`, and `ConfigurationProfileIdentifier`.
 * @property transform - Optional transform to be applied, can be 'json' or 'binary'.
 */
type AppConfigGetOptions =
  | AppConfigGetOptionsTransformNone
  | AppConfigGetOptionsTransformJson
  | AppConfigGetOptionsTransformBinary
  | undefined;

/**
 * Generic output type for the {@link AppConfigProvider.get | `AppConfigProvider.get()` } get method.
 */
type AppConfigGetOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined,
> = undefined extends ExplicitUserProvidedType
  ? undefined extends InferredFromOptionsType | AppConfigGetOptionsTransformNone
    ? Uint8Array
    : InferredFromOptionsType extends AppConfigGetOptionsTransformNone
      ? Uint8Array
      : InferredFromOptionsType extends AppConfigGetOptionsTransformBinary
        ? string
        : InferredFromOptionsType extends AppConfigGetOptionsTransformJson
          ? JSONValue
          : never
  : ExplicitUserProvidedType;

/**
 * Combined options for the {@link getAppConfig | `getAppConfig()`} utility function.
 */
type GetAppConfigOptions = Omit<
  AppConfigProviderOptions,
  'clientConfig' | 'awsSdkV3Client'
> &
  AppConfigGetOptions;

export type {
  AppConfigProviderOptions,
  AppConfigGetOptions,
  AppConfigGetOutput,
  GetAppConfigOptions,
};
