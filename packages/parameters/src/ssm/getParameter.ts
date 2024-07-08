import { DEFAULT_PROVIDERS } from '../base/DefaultProviders.js';
import { SSMProvider } from './SSMProvider.js';
import type { SSMGetOptions, SSMGetOutput } from '../types/SSMProvider.js';

/**
 * ## Intro
 * The Parameters utility provides an SSMProvider that allows to retrieve parameters from AWS Systems Manager.
 *
 * ## Getting started
 *
 * This utility supports AWS SDK v3 for JavaScript only. This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * To use the provider, you must install the Parameters utility and the AWS SDK v3 for JavaScript for AppConfig:
 *
 * ```sh
 * npm install @aws-lambda-powertools/parameters @aws-sdk/client-ssm
 * ```
 *
 * ## Basic usage
 *
 * @example
 * ```typescript
 * import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter
 *   const parameter = await getParameter('/my-parameter');
 * };
 * ```
 *
 * ## Advanced usage
 *
 * ### Decryption
 *
 * If you have encrypted parameters, you can use the `decrypt` option to automatically decrypt them.
 *
 * @example
 * ```typescript
 * import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *  // Retrieve a parameter and decrypt it
 *  const parameter = await getParameter('/my-parameter', { decrypt: true });
 * };
 * ```
 *
 * ### Caching
 *
 * By default, the provider will cache parameters retrieved in-memory for 5 seconds.
 * You can adjust how long values should be kept in cache by using the `maxAge` parameter.
 *
 * @example
 * ```typescript
 * import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and cache it for 10 seconds
 *   const parameter = await getParameter('/my-parameter', { maxAge: 10 });
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and always fetch the latest value
 *   const parameter = await getParameter('/my-parameter', { forceFetch: true });
 * };
 * ```
 *
 * ### Transformations
 *
 * For parameters stored as JSON you can use the transform argument for deserialization. This will return a JavaScript object instead of a string.
 *
 * @example
 * ```typescript
 * import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and parse it as JSON
 *   const parameter = await getParameter('/my-parameter', { transform: 'json' });
 * };
 * ```
 *
 * For parameters that are instead stored as base64-encoded binary data, you can use the transform argument set to `binary` for decoding. This will return a decoded string.
 *
 * @example
 * ```typescript
 * import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a base64-encoded string and decode it
 *   const parameter = await getParameter('/my-parameter', { transform: 'binary' });
 * };
 * ```
 *
 * ### Extra SDK options
 *
 * When retrieving a parameter, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and pass extra options to the AWS SDK v3 for JavaScript client
 *   const parameter = await getParameter('/my-parameter', {
 *     sdkOptions: {
 *       WithDecryption: true,
 *     },
 *   });
 * };
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript SSM GetParameter command](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/interfaces/getparametercommandinput.html).
 *
 * ### Built-in provider class
 *
 * For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use the {@link SSMProvider} class.
 *
 * ### Options
 *
 * * You can customize the retrieval of the value by passing options to the function:
 * * `maxAge` - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
 * * `forceFetch` - Whether to always fetch a new value from the store regardless if already available in cache
 * * `transform` - Whether to transform the value before returning it. Supported values: `json`, `binary`
 * * `sdkOptions` - Extra options to pass to the AWS SDK v3 for JavaScript client
 * * `decrypt` - Whether to decrypt the value before returning it.
 *
 * For more usage examples, see [our documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/).
 *
 * @param {string} name - The name of the parameter to retrieve
 * @param {SSMGetOptions} options - Options to configure the provider
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/parameters/
 */
const getParameter = async <
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType extends SSMGetOptions | undefined = SSMGetOptions,
>(
  name: string,
  options?: InferredFromOptionsType & SSMGetOptions
): Promise<
  SSMGetOutput<ExplicitUserProvidedType, InferredFromOptionsType> | undefined
> => {
  if (!Object.hasOwn(DEFAULT_PROVIDERS, 'ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }

  return (DEFAULT_PROVIDERS.ssm as SSMProvider).get(name, options) as Promise<
    SSMGetOutput<ExplicitUserProvidedType, InferredFromOptionsType> | undefined
  >;
};

export { getParameter };
