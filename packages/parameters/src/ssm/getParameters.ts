import { DEFAULT_PROVIDERS } from '../base/DefaultProviders.js';
import type {
  SSMGetMultipleOptions,
  SSMGetMultipleOutput,
} from '../types/SSMProvider.js';
import { SSMProvider } from './SSMProvider.js';

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
 * import { getParameters } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters by path
 *   const parameters = await getParameters('/my-parameters-path');
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
 * import { getParameters } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *  // Retrieve parameters and decrypt them
 *  const parameters = await getParameters('/my-parameters-path', { decrypt: true });
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
 * import { getParameters } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and cache them for 10 seconds
 *   const parameters = await getParameters('/my-parameters-path', { maxAge: 10 });
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest values from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { getParameters } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and always fetch the latest values
 *   const parameters = await getParameters('/my-parameters-path', { forceFetch: true });
 * };
 * ```
 *
 * ### Transformations
 *
 * For parameters stored as JSON you can use the transform argument for deserialization. This will return a JavaScript objects instead of a strings.
 *
 * @example
 * ```typescript
 * import { getParameters } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and parse them as JSON
 *   const parameters = await getParameters('/my-parameters-path', { transform: 'json' });
 * };
 * ```
 *
 * For parameters that are instead stored as base64-encoded binary data, you can use the transform argument set to `binary` for decoding. This will return decoded strings for each parameter.
 *
 * @example
 * ```typescript
 * import { getParameters } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve base64-encoded strings and decode them
 *   const parameters = await getParameters('/my-parameters-path', { transform: 'binary' });
 * };
 * ```
 *
 * ### Extra SDK options
 *
 * When retrieving a parameter, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { getParameters } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and pass extra options to the AWS SDK v3 for JavaScript client
 *   const parameters = await getParameters('/my-parameters-path', {
 *     sdkOptions: {
 *       WithDecryption: true,
 *     },
 *   });
 * };
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript SSM getParametersByPath command](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/interfaces/getParameterssbypathcommandinput.html).
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
 * * `recursive` - Whether to recursively retrieve all parameters within the path.
 *
 * For more usage examples, see [our documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/).
 *
 * @param {string} path - The path of the parameters to retrieve
 * @param {SSMGetMultipleOptions} options - Options to configure the provider
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
 */
const getParameters = async <
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType extends
    | SSMGetMultipleOptions
    | undefined = SSMGetMultipleOptions,
>(
  path: string,
  options?: InferredFromOptionsType & SSMGetMultipleOptions
): Promise<
  | SSMGetMultipleOutput<ExplicitUserProvidedType, InferredFromOptionsType>
  | undefined
> => {
  if (!Object.hasOwn(DEFAULT_PROVIDERS, 'ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }

  return (DEFAULT_PROVIDERS.ssm as SSMProvider).getMultiple(
    path,
    options
  ) as Promise<
    | SSMGetMultipleOutput<ExplicitUserProvidedType, InferredFromOptionsType>
    | undefined
  >;
};

export { getParameters };
