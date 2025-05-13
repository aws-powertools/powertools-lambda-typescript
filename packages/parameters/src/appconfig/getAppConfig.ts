import { DEFAULT_PROVIDERS } from '../base/index.js';
import type {
  AppConfigGetOutput,
  GetAppConfigOptions,
} from '../types/AppConfigProvider.js';
import { AppConfigProvider } from './AppConfigProvider.js';

/**
 * ## Intro
 * The Parameters utility provides an AppConfigProvider that allows to retrieve configuration profiles from AWS AppConfig.
 *
 * ## Getting started
 *
 * This utility supports AWS SDK v3 for JavaScript only. This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * To use the provider, you must install the Parameters utility and the AWS SDK v3 for JavaScript for AppConfig:
 *
 * ```sh
 * npm install @aws-lambda-powertools/parameters @aws-sdk/client-appconfigdata
 * ```
 *
 * ## Basic usage
 *
 * @example
 * ```typescript
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a configuration profile
 *   const encodedConfig = await getAppConfig('my-config', {
 *     application: 'my-app',
 *     environment: 'prod',
 *   });
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 *
 * ## Advanced usage
 *
 * ### Caching
 *
 * By default, the provider will cache parameters retrieved in-memory for 5 seconds.
 * You can adjust how long values should be kept in cache by using the `maxAge` parameter.
 *
 * @example
 * ```typescript
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a configuration profile and cache it for 10 seconds
 *   const encodedConfig = await getAppConfig('my-config', {
 *     application: 'my-app',
 *     environment: 'prod',
 *   });
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a config and always fetch the latest value
 *   const config = await getAppConfig('my-config', {
 *     application: 'my-app',
 *     environment: 'prod',
 *     forceFetch: true,
 *   });
 *   const config = new TextDecoder('utf-8').decode(encodedConfig);
 * };
 * ```
 *
 * ### Transformations
 *
 * For configurations stored as freeform JSON, Freature Flag, you can use the transform argument for deserialization. This will return a JavaScript object instead of a string.
 *
 * @example
 * ```typescript
 * import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a JSON config or Feature Flag and parse it as JSON
 *   const config = await getAppConfig('my-config', {
 *     application: 'my-app',
 *     environment: 'prod',
 *     transform: 'json'
 *   });
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
 * ### Extra SDK options
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
 * ### Built-in provider class
 *
 * For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use the {@link AppConfigProvider} class.
 *
 * For more usage examples, see [our documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/).
 *
 * @param {string} name - The name of the configuration profile or its ID
 * @param {GetAppConfigOptions} options - Options to configure the provider
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
 */
const getAppConfig = <
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType extends
    | GetAppConfigOptions
    | undefined = GetAppConfigOptions,
>(
  name: string,
  options: InferredFromOptionsType & GetAppConfigOptions
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
