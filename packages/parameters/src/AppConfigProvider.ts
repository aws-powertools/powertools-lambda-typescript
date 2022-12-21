import { BaseProvider, DEFAULT_PROVIDERS } from 'BaseProvider';
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from '@aws-sdk/client-appconfigdata';
import type {
  StartConfigurationSessionCommandInput,
  GetLatestConfigurationCommandInput,
} from '@aws-sdk/client-appconfigdata';
import type { AppConfigGetOptionsInterface } from './types/AppConfigProvider';

class AppConfigProvider extends BaseProvider {
  public client: AppConfigDataClient;
  private application?: string;
  private environment?: string;
  private token: string | undefined;

  /**
   * It initializes the AppConfigProvider class with an optional set of options like region: 'us-west-1'.
   * *
   * @param {AppConfigDataClientConfig} options
   */
  public constructor(options: AppConfigGetOptionsInterface = {}) {
    super();
    this.client = new AppConfigDataClient(options.config || {});
    this.environment = options.environment;
    this.application = options.application || 'service_undefined'; // TODO: get value from ENV VARIABLES
  }

  /**
   * Retrieve a parameter value from AWS App config.
   *
   * @param {string} name - Name of the configuration
   * @param {StartConfigurationSessionCommandInput} [sdkOptions] - SDK options to propagate to `StartConfigurationSession` API call
   * @returns {Promise<string | undefined>}
   */
  protected async _get(
    name: string,
    options?: AppConfigGetOptionsInterface
  ): Promise<string | undefined> {
    /**
     * The new AppConfig APIs require two API calls to return the configuration
     * First we start the session and after that we retrieve the configuration
     * We need to store the token to use in the next execution
     **/
    if (!this.token) {
      const sessionOptions: StartConfigurationSessionCommandInput = {
        ConfigurationProfileIdentifier: name,
        EnvironmentIdentifier: this.environment,
        ApplicationIdentifier: this.application,
      };
      if (options && options.hasOwnProperty('sdkOptions')) {
        Object.assign(sessionOptions, options.sdkOptions);
      }

      const sessionCommand = new StartConfigurationSessionCommand(
        sessionOptions
      );

      const session = await this.client.send(sessionCommand);
      this.token = session.InitialConfigurationToken;
    }

    const getConfigurationCommand = new GetLatestConfigurationCommand({
      ConfigurationToken: this.token,
    });
    const response = await this.client.send(getConfigurationCommand);

    //  Should we cache and flush the token after 24 hours?
    //  NextPollConfigurationToken expires in 24 hours after the last request and causes `BadRequestException`
    this.token = response.NextPollConfigurationToken;

    const configuration = response.Configuration;

    // should we convert Uint8Array to string?
    const utf8decoder = new TextDecoder();
    const value = configuration ? utf8decoder.decode(configuration) : undefined;

    return value;
  }

  /**
   * Retrieving multiple parameter values is not supported with AWS App Config Provider.
   *
   * @throws Not Implemented Error.
   */
  protected async _getMultiple(
    path: string,
    sdkOptions?: Partial<GetLatestConfigurationCommandInput>
  ): Promise<Record<string, string | undefined>> {
    return this._notImplementedError();
  }

  private _notImplementedError(): never {
    throw new Error('Not Implemented');
  }
}

const getAppConfig = (
  name: string,
  options?: AppConfigGetOptionsInterface
): Promise<undefined | string | Record<string, unknown>> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('appconfig')) {
    DEFAULT_PROVIDERS.appconfig = new AppConfigProvider(options);
  }

  return DEFAULT_PROVIDERS.appconfig.get(name, options);
};

export { AppConfigProvider, getAppConfig };
