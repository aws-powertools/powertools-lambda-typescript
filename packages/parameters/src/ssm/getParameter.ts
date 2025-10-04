import { DEFAULT_PROVIDERS } from '../base/DefaultProviders.js';
import type { SSMGetOptions, SSMGetOutput } from '../types/SSMProvider.js';
import { SSMProvider } from './SSMProvider.js';

/**
 * The Parameters utility provides an `SSMProvider` that allows to retrieve parameters from AWS Systems Manager.
 *
 * This utility supports AWS SDK v3 for JavaScript only. This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * **Basic usage**
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
 * **Decryption**
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
 * **Caching**
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
 * **Transformations**
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
 * **Extra SDK options**
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
 * **Built-in provider class**
 *
 * For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use the {@link SSMProvider} class.
 *
 * @see https://docs.aws.amazon.com/powertools/typescript/latest/features/parameters/
 *
 * @param name - The name of the parameter to retrieve
 * @param options - Optional options to configure the provider
 * @param options.maxAge - Optional maximum age of the value in the cache, in seconds (default: `5`)
 * @param options.forceFetch - Optional flag to always fetch a new value from the store regardless if already available in cache (default: `false`)
 * @param options.transform - Optional transform to be applied, can be `json` or `binary`
 * @param options.sdkOptions - Optional additional options to pass to the AWS SDK v3 client, supports all options from {@link GetParameterCommandInput | `GetParameterCommandInput`} except `Name`
 * @param options.decrypt - Optional flag to decrypt the value before returning it (default: `false`)
 */
const getParameter = <
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType extends SSMGetOptions | undefined = SSMGetOptions,
>(
  name: string,
  options?: NonNullable<InferredFromOptionsType & SSMGetOptions>
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
