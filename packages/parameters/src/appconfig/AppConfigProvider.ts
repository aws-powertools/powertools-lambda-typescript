import { getServiceName } from '@aws-lambda-powertools/commons/utils/env';
import type {
  AppConfigDataClientConfig,
  StartConfigurationSessionCommandInput,
} from '@aws-sdk/client-appconfigdata';
import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata';
import { BaseProvider } from '../base/BaseProvider.js';
import { APPCONFIG_TOKEN_EXPIRATION } from '../constants.js';
import type {
  AppConfigGetOptions,
  AppConfigGetOutput,
  AppConfigProviderOptions,
} from '../types/AppConfigProvider.js';

/**
 * The Parameters utility provides an `AppConfigProvider` that allows to retrieve configuration profiles from AWS AppConfig.
 *
 * This utility supports AWS SDK v3 for JavaScript only (`@aws-sdk/client-appconfigdata`). This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * **Basic usage**
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider({
 *   application: 'my-app',
 *   environment: 'prod',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a configuration profile
 *   const encodedConfig = await configProvider.get('my-config');
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 * If you want to retrieve configs without customizing the provider, you can use the {@link getAppConfig} function instead.
 *
 * **Caching**
 *
 * By default, the provider will cache parameters retrieved in-memory for 5 seconds.
 * You can adjust how long values should be kept in cache by using the `maxAge` parameter.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider({
 *   application: 'my-app',
 *   environment: 'prod',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a configuration profile and cache it for 10 seconds
 *   const encodedConfig = await configProvider.get('my-config', { maxAge: 10 });
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider({
 *   application: 'my-app',
 *   environment: 'prod',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a config and always fetch the latest value
 *   const config = await configProvider.get('my-config', { forceFetch: true });
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 *
 * **Transformations**
 *
 * For configurations stored as freeform JSON, Freature Flag, you can use the transform argument for deserialization. This will return a JavaScript object instead of a string.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider({
 *   application: 'my-app',
 *   environment: 'prod',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a JSON config or Feature Flag and parse it as JSON
 *   const config = await configProvider.get('my-config', { transform: 'json' });
 * };
 * ```
 *
 * For configurations that are instead stored as base64-encoded binary data, you can use the transform argument set to `binary` for decoding. This will return a decoded string.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider({
 *   application: 'my-app',
 *   environment: 'prod',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a base64-encoded string and decode it
 *   const config = await configProvider.get('my-config', { transform: 'binary' });
 * };
 * ```
 *
 * **Extra SDK options**
 *
 * When retrieving a configuration profile, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider({
 *   application: 'my-app',
 *   environment: 'prod',
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a config and pass extra options to the AWS SDK v3 for JavaScript client
 *   const config = await configProvider.get('my-config', {
 *     sdkOptions: {
 *       RequiredMinimumPollIntervalInSeconds: 60,
 *     },
 *   });
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript AppConfigData client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-appconfigdata/interfaces/startconfigurationsessioncommandinput.html).
 *
 * **Customize AWS SDK v3 for JavaScript client**
 *
 * By default, the provider will create a new AppConfigData client using the default configuration.
 *
 * You can customize the client by passing a custom configuration object to the provider.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const configProvider = new AppConfigProvider({
 *   application: 'my-app',
 *   environment: 'prod',
 *   clientConfig: { region: 'eu-west-1' },
 * });
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript AppConfig Data client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-appconfigdata/interfaces/appconfigdataclientconfig.html).
 *
 * Otherwise, if you want to use a custom client altogether, you can pass it to the provider.
 *
 * @example
 * ```typescript
 * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
 * import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';
 *
 * const client = new AppConfigDataClient({ region: 'eu-west-1' });
 * const configProvider = new AppConfigProvider({
 *   application: 'my-app',
 *   environment: 'prod',
 *   awsSdkV3Client: client,
 * });
 * ```
 *
 * This object must be an instance of the [AWS SDK v3 for JavaScript AppConfig Data client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-appconfigdata/classes/appconfigdataclient.html).
 *
 * For more usage examples, see [our documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/).
 */
class AppConfigProvider extends BaseProvider {
  public declare client: AppConfigDataClient;
  protected configurationTokenStore = new Map<
    string,
    { value: string; expiration: number }
  >();
  protected valueStore = new Map<string, Uint8Array>();
  private readonly application?: string;
  private readonly environment: string;

  /**
   * initializes an `AppConfigProvider` class instance.
   *
   * @param options - The configuration object.
   * @param options.environment - The environment ID or the environment name.
   * @param options.application - Optional application ID or the application name.
   * @param options.clientConfig - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with `awsSdkV3Client`. Accepts the same configuration object as the AWS SDK v3 client ({@link AppConfigDataClientConfig | `AppConfigDataClientConfig`}).
   * @param options.awsSdkV3Client - Optional ({@link AppConfigDataClient | `AppConfigDataClient`}) instance to pass during `AppConfigProvider` class instantiation. Mutually exclusive with `clientConfig`.
   *
   */
  public constructor(options: AppConfigProviderOptions) {
    super({
      awsSdkV3ClientPrototype: AppConfigDataClient as new (
        config?: unknown
      ) => AppConfigDataClient,
      clientConfig: options.clientConfig,
      awsSdkV3Client: options.awsSdkV3Client,
    });

    const { application, environment } = options;
    this.application = application ?? getServiceName();
    if (!this.application || this.application.trim().length === 0) {
      throw new Error(
        'Application name is not defined or POWERTOOLS_SERVICE_NAME is not set'
      );
    }
    this.environment = environment;
  }

  /**
   * Retrieve a configuration profile from AWS AppConfig.
   *
   * @example
   * ```typescript
   * import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
   *
   * const configProvider = new AppConfigProvider({
   *   application: 'my-app',
   *   environment: 'prod',
   * });
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve a configuration profile
   *   const encodedConfig = await configProvider.get('my-config');
   *   const config = new TextDecoder('utf-8').decode(encodedConfig);
   * };
   * ```
   *
   * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
   *
   * @param name - The name of the configuration profile or its ID
   * @param options - Options to configure the provider
   * @param options.maxAge - Maximum age of the value in the cache, in seconds.
   * @param options.forceFetch - Force fetch the value from the parameter store, ignoring the cache.
   * @param options.sdkOptions - Additional options to pass to the AWS SDK v3 client. Supports all options from {@link StartConfigurationSessionCommandInput | `StartConfigurationSessionCommandInput`} except `ApplicationIdentifier`, `EnvironmentIdentifier`, and `ConfigurationProfileIdentifier`.
   * @param options.transform - Optional transform to be applied, can be 'json' or 'binary'.
   */
  public get<
    ExplicitUserProvidedType = undefined,
    InferredFromOptionsType extends
      | AppConfigGetOptions
      | undefined = AppConfigGetOptions,
  >(
    name: string,
    options?: InferredFromOptionsType & AppConfigGetOptions
  ): Promise<
    | AppConfigGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>
    | undefined
  > {
    return super.get(name, options) as Promise<
      | AppConfigGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>
      | undefined
    >;
  }

  /**
   * Retrieving multiple configurations is not supported by AWS AppConfig.
   */
  /* v8 ignore start */ public async getMultiple(
    path: string,
    _options?: unknown
  ): Promise<void> {
    await super.getMultiple(path);
  } /* v8 ignore stop */

  /**
   * Retrieve a configuration from AWS AppConfig.
   *
   * First we start the session and after that we retrieve the configuration from AppSync.
   * When starting a session, the service returns a token that can be used to poll for changes
   * for up to 24hrs, so we cache it for later use together with the expiration date.
   *
   * The value of the configuration is also cached internally because AppConfig returns an empty
   * value if the configuration has not changed since the last poll. This way even if your code
   * polls the configuration multiple times, we return the most recent value by returning the cached
   * one if an empty response is returned by AppConfig.
   *
   * @param name - Name of the configuration or its ID
   * @param options - SDK options to propagate to `StartConfigurationSession` API call
   * @param options.maxAge - Maximum age of the value in the cache, in seconds.
   * @param options.forceFetch - Force fetch the value from the parameter store, ignoring the cache.
   * @param options.sdkOptions - Additional options to pass to the AWS SDK v3 client. Supports all options from {@link StartConfigurationSessionCommandInput | `StartConfigurationSessionCommandInput`} except `ApplicationIdentifier`, `EnvironmentIdentifier`, and `ConfigurationProfileIdentifier`.
   * @param options.transform - Optional transform to be applied, can be 'json' or 'binary'.
   */
  protected async _get(
    name: string,
    options?: AppConfigGetOptions
  ): Promise<Uint8Array | undefined> {
    if (
      !this.configurationTokenStore.has(name) ||
      // biome-ignore lint/style/noNonNullAssertion: we check if the value is in the map before accessing it
      this.configurationTokenStore.get(name)!.expiration <= Date.now()
    ) {
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

      if (!session.InitialConfigurationToken)
        throw new Error('Unable to retrieve the configuration token');

      this.configurationTokenStore.set(name, {
        value: session.InitialConfigurationToken,
        expiration: Date.now() + APPCONFIG_TOKEN_EXPIRATION,
      });
    }

    const getConfigurationCommand = new GetLatestConfigurationCommand({
      ConfigurationToken: this.configurationTokenStore.get(name)?.value,
    });

    const response = await this.client.send(getConfigurationCommand);

    if (response.NextPollConfigurationToken) {
      this.configurationTokenStore.set(name, {
        value: response.NextPollConfigurationToken,
        expiration: Date.now() + APPCONFIG_TOKEN_EXPIRATION,
      });
    } else {
      this.configurationTokenStore.delete(name);
    }

    /** When the response is not empty, stash the result locally before returning
     * See AppConfig docs:
     * {@link https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-retrieving-the-configuration.html}
     */
    if (
      response.Configuration !== undefined &&
      response.Configuration?.length > 0
    ) {
      this.valueStore.set(name, response.Configuration);

      return response.Configuration;
    }

    // Otherwise, use a stashed value
    return this.valueStore.get(name);
  }

  /**
   * Retrieving multiple configurations is not supported by AWS AppConfig.
   *
   * @throws Not Implemented Error.
   */
  protected _getMultiple(
    _path: string,
    _sdkOptions?: unknown
  ): Promise<Record<string, unknown> | undefined> {
    throw new Error('Method not implemented.');
  }
}

export { AppConfigProvider };
