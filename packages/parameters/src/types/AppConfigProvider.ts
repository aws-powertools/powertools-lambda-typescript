import type {
  AppConfigDataClientConfig,
  StartConfigurationSessionCommandInput,
} from '@aws-sdk/client-appconfigdata';
import type { GetOptionsInterface } from 'types/BaseProvider';

/**
 * Options for the AppConfigProvider class constructor.
 *
 *  @interface AppConfigProviderOptions
 *  @property {string} environment - The environment ID or the environment name.
 *  @property {string} [application] - The application ID or the application name.
 *  @property {AppConfigDataClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 */
interface AppConfigProviderOptions {
  environment: string
  application?: string
  clientConfig?: AppConfigDataClientConfig
}

/**
 * Options for the AppConfigProvider get method.
 *
 * @interface AppConfigGetOptionsInterface
 * @extends {GetOptionsInterface}
 * @property {StartConfigurationSessionCommandInput} [sdkOptions] - Required options to start configuration session.
 */
interface AppConfigGetOptionsInterface extends Omit<GetOptionsInterface, 'sdkOptions'> {
  sdkOptions?: Omit<
  Partial<StartConfigurationSessionCommandInput>,
  | 'ApplicationIdentifier'
  | 'EnvironmentIdentifier | ConfigurationProfileIdentifier'
  >
}

/**
 * Combined options for the getAppConfig utility function.
 *
 * @interface getAppConfigCombinedInterface
 * @extends {AppConfigProviderOptions, AppConfigGetOptionsInterface}
 */
interface GetAppConfigCombinedInterface
  extends Omit<AppConfigProviderOptions, 'clientConfig'>,
  AppConfigGetOptionsInterface {}

export {
  AppConfigProviderOptions,
  AppConfigGetOptionsInterface,
  GetAppConfigCombinedInterface,
};
