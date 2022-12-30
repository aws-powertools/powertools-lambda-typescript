import type {
  AppConfigDataClientConfig,
} from '@aws-sdk/client-appconfigdata';
import type { GetOptionsInterface } from 'types/BaseProvider';

/**
 * Options for the AppConfigProvider get method.
 *
 * @interface AppConfigGetOptionsInterface
 * @extends {GetOptionsInterface}
 * @property {} [clientConfig] - optional configuration to pass during client initialization
 * @property {} sdkOptions - required options to start configuration session.
 */
interface AppConfigGetOptionsInterface
  extends Omit<GetOptionsInterface, 'sdkOptions'> {
  clientConfig?: AppConfigDataClientConfig
  sdkOptions?: {
    application: string
    environment: string
  }
}

export { AppConfigGetOptionsInterface };
