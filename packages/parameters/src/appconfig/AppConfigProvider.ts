import { BaseProvider, DEFAULT_PROVIDERS } from '../BaseProvider';
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from '@aws-sdk/client-appconfigdata';
import type { StartConfigurationSessionCommandInput } from '@aws-sdk/client-appconfigdata';
import type {
  AppConfigProviderOptions,
  AppConfigGetOptionsInterface,
} from '../types/AppConfigProvider';

class AppConfigProvider extends BaseProvider {
  public client: AppConfigDataClient;
  protected configurationTokenStore: Map<string, string> = new Map();
  private application?: string;
  private environment: string;
  
  /**
   * It initializes the AppConfigProvider class'.
   * *
   * @param {AppConfigProviderOptions} options
   */
  public constructor(options: AppConfigProviderOptions) {
    super();
    if (options?.awsSdkV3Client) {
      if (options?.awsSdkV3Client instanceof AppConfigDataClient) {
        this.client = options.awsSdkV3Client;
      } else {
        throw Error('Not a valid AppConfigDataClient provided');
      }
    } else {
      this.client = new AppConfigDataClient(options.clientConfig || {});
    }
    
    if (!options?.application && !process.env['POWERTOOLS_SERVICE_NAME']) {
      throw new Error(
        'Application name is not defined or POWERTOOLS_SERVICE_NAME is not set'
      );
    }
    this.application =
      options.application || process.env['POWERTOOLS_SERVICE_NAME'];
    this.environment = options.environment;
  }

  /**
   * Retrieve a configuration from AWS App config.
   */
  public async get(
    name: string,
    options?: AppConfigGetOptionsInterface
  ): Promise<undefined | string | Uint8Array | Record<string, unknown>> {
    return super.get(name, options);
  }

  /**
   * Retrieving multiple configurations is not supported by AWS App Config Provider.
   */
  public async getMultiple(
    path: string,
    _options?: unknown
  ): Promise<undefined | Record<string, unknown>> {
    return super.getMultiple(path);
  }

  /**
   * Retrieve a configuration from AWS App config.
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
     * We need to store { name: token } pairs to use in the next execution
     **/
    
    if (!this.configurationTokenStore.has(name)) {

      const sessionOptions: StartConfigurationSessionCommandInput = {
        ...(options?.sdkOptions || {}),
        ApplicationIdentifier: this.application,
        ConfigurationProfileIdentifier: name,
        EnvironmentIdentifier: this.environment,
      };

      const sessionCommand = new StartConfigurationSessionCommand(
        sessionOptions
      );

      const session = await this.client.send(sessionCommand);

      if (!session.InitialConfigurationToken) throw new Error('Unable to retrieve the configuration token');

      this.configurationTokenStore.set(name, session.InitialConfigurationToken);
    }

    const getConfigurationCommand = new GetLatestConfigurationCommand({
      ConfigurationToken: this.configurationTokenStore.get(name),
    });

    const response = await this.client.send(getConfigurationCommand);
    
    if (response.NextPollConfigurationToken) {
      this.configurationTokenStore.set(name, response.NextPollConfigurationToken);
    } else {
      this.configurationTokenStore.delete(name);
    }

    return response.Configuration;
  }

  /**
   * Retrieving multiple configurations is not supported by AWS App Config Provider API.
   *
   * @throws Not Implemented Error.
   */
  protected async _getMultiple(
    _path: string,
    _sdkOptions?: unknown
  ): Promise<Record<string, string | undefined>> {
    return this._notImplementedError();
  }

  private _notImplementedError(): never {
    throw new Error('Not Implemented');
  }
}

export { AppConfigProvider, DEFAULT_PROVIDERS };
