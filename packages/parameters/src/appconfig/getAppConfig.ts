import { DEFAULT_PROVIDERS } from '../base/index.js';
import type {
  AppConfigGetOutput,
  GetAppConfigOptions,
} from '../types/AppConfigProvider.js';
import { AppConfigProvider } from './AppConfigProvider.js';

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
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const encodedConfig = await getAppConfig('my-config', {
 *   application: 'my-app',
 *   environment: 'prod',
 * });
 * const config = new TextDecoder('utf-8').decode(encodedConfig);
 *
 * export const handler = async (): Promise<void> => {
 *   // Use the config variable as needed
 *   console.log(config);
 * };
 * ```
 *
 * **Caching**
 *
 * By default, the provider will cache parameters retrieved in-memory for 5 seconds.
 * You can adjust how long values should be kept in cache by using the `maxAge` parameter.
 *
 * @example
 * ```typescript
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const encodedConfig = await getAppConfig('my-config', {
 *   application: 'my-app',
 *   environment: 'prod',
 *   maxAge: 10, // Cache for 10 seconds
 * });
 * const config = new TextDecoder('utf-8').decode(encodedConfig);
 *
 * export const handler = async (): Promise<void> => {
 *   // Use the config variable as needed
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * const encodedConfig = await getAppConfig('my-config', {
 *   application: 'my-app',
 *   environment: 'prod',
 *   forceFetch: true, // Always fetch the latest value
 * });
 * const config = new TextDecoder('utf-8').decode(encodedConfig);
 *
 * export const handler = async (): Promise<void> => {
 *   // Use the config variable as needed
 *   console.log
 * };
 * ```
 *
 * **Transformations**
 *
 * For configurations stored as freeform JSON, Freature Flag, you can use the transform argument for deserialization. This will return a JavaScript object instead of a string.
 *
 * @example
 * ```typescript
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * // Retrieve a JSON config and parse it as JSON
 * const encodedConfig = await getAppConfig('my-config', {
 *   application: 'my-app',
 *   environment: 'prod',
 *   transform: 'json'
 * });
 *
 * export const handler = async (): Promise<void> => {
 *   // Use the config variable as needed
 *   console.log(config);
 * };
 * ```
 *
 * For configurations that are instead stored as base64-encoded binary data, you can use the transform argument set to `binary` for decoding. This will return a decoded string.
 *
 * @example
 * ```typescript
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a base64-encoded string and decode it
 *   const config = await getAppConfig('my-config', {
 *     application: 'my-app',
 *     environment: 'prod',
 *     transform: 'binary'
 *   });
 * };
 * ```
 *
 * **Extra SDK options**
 *
 * When retrieving a configuration profile, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a config and pass extra options to the AWS SDK v3 for JavaScript client
 *   const config = await getAppConfig('my-config', {
 *     application: 'my-app',
 *     environment: 'prod',
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
 * For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use the {@link AppConfigProvider | `AppConfigProvider`} class.
 *
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
 *
 * @param name - The name of the configuration profile to retrieve
 * @param options - Options to configure the provider
 * @param options.application - The application ID or the application name
 * @param options.environment - The environment ID or the environment name
 * @param options.maxAge - Optional maximum age of the value in the cache, in seconds (default: `5`)
 * @param options.forceFetch - Optional flag to always fetch a new value from the store regardless if already available in cache (default: `false`)
 * @param options.transform - Optional transform to be applied, can be `json` or `binary`
 * @param options.sdkOptions - Optional additional options to pass to the AWS SDK v3 client, supports all options from {@link StartConfigurationSessionCommandInput | `StartConfigurationSessionCommandInput`} except `ApplicationIdentifier`, `EnvironmentIdentifier`, and `ConfigurationProfileIdentifier`
 */
const getAppConfig = <
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType extends
    | GetAppConfigOptions
    | undefined = GetAppConfigOptions,
>(
  name: string,
  options: NonNullable<InferredFromOptionsType & GetAppConfigOptions>
): Promise<
  | AppConfigGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>
  | undefined
> => {
  if (!Object.hasOwn(DEFAULT_PROVIDERS, 'appconfig')) {
    DEFAULT_PROVIDERS.appconfig = new AppConfigProvider({
      application: options?.application,
      environment: options.environment,
    });
  }

  return (DEFAULT_PROVIDERS.appconfig as AppConfigProvider).get(name, {
    maxAge: options?.maxAge,
    transform: options?.transform,
    forceFetch: options?.forceFetch,
    sdkOptions: options?.sdkOptions,
  }) as Promise<
    | AppConfigGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>
    | undefined
  >;
};

export { getAppConfig };
