import { BaseProvider, DEFAULT_PROVIDERS } from './BaseProvider';
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
  private application: string;
  private environment: string;
  private latestConfiguration: Uint8Array | undefined;
  private token: string | undefined;

  /**
   * It initializes the AppConfigProvider class'.
   * *
   * @param {AppConfigGetOptionsInterface} config
   */
  public constructor(options: AppConfigGetOptionsInterface) {
    super();
    this.client = new AppConfigDataClient(options.clientConfig || {});
    this.application = options?.sdkOptions?.application || 'app_undefined'; // TODO: make it optional when we add retrieving from env var
    this.environment = options?.sdkOptions?.environment || 'env_undefined';
  }

  public async get(name: string, options?: AppConfigGetOptionsInterface): Promise<undefined | string | Uint8Array | Record<string, unknown>> {
    return super.get(name, options);
  }

  /**
   * Retrieve a parameter value from AWS App config.
   *
   * @param {string} name - Name of the configuration
   * @param {AppConfigGetOptionsInterface} options - SDK options to propagate to `StartConfigurationSession` API call
   * @returns {Promise<Uint8Array | undefined>}
   */
  protected async _get(
    name: string,
    options?: AppConfigGetOptionsInterface
  ): Promise<Uint8Array | undefined> {
    /**
     * The new AppConfig APIs require two API calls to return the configuration
     * First we start the session and after that we retrieve the configuration
     * We need to store the token to use in the next execution
     **/
    if (!this.token) {
      const sessionOptions: StartConfigurationSessionCommandInput = {
        ConfigurationProfileIdentifier: name,
        EnvironmentIdentifier: this.application,
        ApplicationIdentifier: this.environment,
      };

      if (options?.sdkOptions) {
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

    this.token = response.NextPollConfigurationToken;

    const configuration = response.Configuration;

    if (configuration) {
      this.latestConfiguration = configuration;
    }

    return this.latestConfiguration;
  }

  /**
   * Retrieving multiple parameter values is not supported with AWS App Config Provider.
   *
   * @throws Not Implemented Error.
   */
  protected async _getMultiple(
    _path: string,
    _sdkOptions?: Partial<GetLatestConfigurationCommandInput>
  ): Promise<Record<string, string | undefined>> {
    return this._notImplementedError();
  }

  private _notImplementedError(): never {
    throw new Error('Not Implemented');
  }
}

const getAppConfig = (
  name: string,
  options: AppConfigGetOptionsInterface
): Promise<undefined | string | Uint8Array | Record<string, unknown>> => {
  if (!DEFAULT_PROVIDERS.hasOwnProperty('appconfig')) {
    DEFAULT_PROVIDERS.appconfig = new AppConfigProvider(options);
  }

  return DEFAULT_PROVIDERS.appconfig.get(name, options);
};

export { AppConfigProvider, getAppConfig };
