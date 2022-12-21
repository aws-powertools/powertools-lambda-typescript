import type { StartConfigurationSessionCommandInput, AppConfigDataClientConfig } from '@aws-sdk/client-appconfigdata';
import type { GetOptionsInterface } from 'types/BaseProvider';

/**
 * Options for the AppConfigProvider get method.
 *
 * @interface AppConfigGetOptionsInterface
 * @extends {GetOptionsInterface}
 * @property {Partial<StartConfigurationSessionCommandInput>} sdkOptions - Options for the AWS SDK.
 */
interface AppConfigGetOptionsInterface extends Omit<GetOptionsInterface, 'sdkOptions'> {
  application?: string
  config?: AppConfigDataClientConfig
  environment?: string
  sdkOptions?: Partial<StartConfigurationSessionCommandInput>
}

export { AppConfigGetOptionsInterface };
