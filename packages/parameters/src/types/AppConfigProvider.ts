import type { JSONValue } from '@aws-lambda-powertools/commons';
import type {
  AppConfigDataClient,
  AppConfigDataClientConfig,
  StartConfigurationSessionCommandInput,
} from '@aws-sdk/client-appconfigdata';
import type { GetOptionsInterface } from './BaseProvider';

/**
 * Base interface for AppConfigProviderOptions.
 *
 * @interface
 * @property {string} environment - The environment ID or the environment name.
 * @property {string} [application] - The application ID or the application name.
 */
interface AppConfigProviderOptionsBaseInterface {
  environment: string;
  application?: string;
}

/**
 * Interface for AppConfigProviderOptions with clientConfig property.
 *
 * @interface
 * @extends AppConfigProviderOptionsBaseInterface
 * @property {AppConfigDataClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 * @property {never} [awsSdkV3Client] - This property should never be passed.
 */
interface AppConfigProviderOptionsWithClientConfig
  extends AppConfigProviderOptionsBaseInterface {
  clientConfig?: AppConfigDataClientConfig;
  awsSdkV3Client?: never;
}

/**
 * Interface for AppConfigProviderOptions with awsSdkV3Client property.
 *
 * @interface
 * @extends AppConfigProviderOptionsBaseInterface
 * @property {AppConfigDataClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during AppConfigProvider class instantiation
 * @property {never} [clientConfig] - This property should never be passed.
 */
interface AppConfigProviderOptionsWithClientInstance
  extends AppConfigProviderOptionsBaseInterface {
  awsSdkV3Client?: AppConfigDataClient;
  clientConfig?: never;
}

/**
 * Options for the AppConfigProvider class constructor.
 *
 * @type AppConfigProviderOptions
 * @property {string} environment - The environment ID or the environment name.
 * @property {string} [application] - The application ID or the application name.
 * @property {AppConfigDataClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with awsSdkV3Client.
 * @property {AppConfigDataClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during AppConfigProvider class instantiation. Mutually exclusive with clientConfig.
 */
type AppConfigProviderOptions =
  | AppConfigProviderOptionsWithClientConfig
  | AppConfigProviderOptionsWithClientInstance;

/**
 * Options for the AppConfigProvider get method.
 *
 * @interface AppConfigGetOptionsBase
 * @extends {GetOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {StartConfigurationSessionCommandInput} [sdkOptions] - Additional options to pass to the AWS SDK v3 client.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 */
interface AppConfigGetOptionsBase extends GetOptionsInterface {
  /**
   * Additional options to pass to the AWS SDK v3 client. Supports all options from `StartConfigurationSessionCommandInput` except `ApplicationIdentifier`, `EnvironmentIdentifier`, and `ConfigurationProfileIdentifier`.
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

type AppConfigGetOptions =
  | AppConfigGetOptionsTransformNone
  | AppConfigGetOptionsTransformJson
  | AppConfigGetOptionsTransformBinary
  | undefined;

/**
 * Generic output type for the AppConfigProvider get method.
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
 * Combined options for the getAppConfig utility function.
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
