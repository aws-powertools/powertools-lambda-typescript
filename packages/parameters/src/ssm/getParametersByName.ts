import { DEFAULT_PROVIDERS } from '../base/DefaultProviders.js';
import type {
  SSMGetParametersByNameOptions,
  SSMGetParametersByNameOutput,
} from '../types/SSMProvider.js';
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
 * import { getParametersByName } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and cache them for 10 seconds
 *   const parameters = await getParametersByName({
 *     '/my-parameter-1': {}, // Use default options
 *     '/my-parameter-2': { maxAge: 10 }, // Cache for 10 seconds
 *   });
 * };
 * ```
 *
 * **Decryption**
 *
 * If you have encrypted parameters, you can use the `decrypt` option to automatically decrypt them.
 *
 * @example
 * ```typescript
 * import { getParametersByName } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and decrypt them
 *   const parameters = await getParametersByName({
 *     '/my-parameter-1': {}, // Use default options
 *     '/my-parameter-2': {}, // Use default options
 *   }, { decrypt: true });
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
 * import { getParametersByName } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and cache them for 10 seconds
 *   const parameters = await getParametersByName({
 *     '/my-parameter-1': {}, // Use default options
 *     '/my-parameter-2': {}, // Use default options
 *   }, { maxAge: 10 });
 * };
 * ```
 *
 * Alternatively, if you need more granular control over caching each parameter, you can pass it in the options object.
 *
 * @example
 * ```typescript
 * import { getParametersByName } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and cache them individually
 *   const parameters = await getParametersByName({
 *     '/my-parameter-1': { maxAge: 10 }, // Cache for 10 seconds
 *     '/my-parameter-2': { maxAge: 20 }, // Cache for 20 seconds
 *   });
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest values from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { getParametersByName } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and pass extra options to skip cache
 *   const parameters = await getParametersByName({
 *     '/my-parameter-1': {}, // Use default options
 *     '/my-parameter-2': {}, // Use default options
 *   }, { forceFetch: true });
 * };
 * ```
 *
 * **Transformations**
 *
 * For parameters stored as JSON you can use the transform argument for deserialization. This will return a JavaScript objects instead of a strings.
 * For parameters that are instead stored as base64-encoded binary data, you can use the transform argument set to `binary` for decoding. This will return decoded strings for each parameter.
 *
 * @example
 * ```typescript
 * import { getParametersByName } from '@aws-lambda-powertools/parameters/ssm';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve parameters and pass extra options to transform them
 *   const parameters = await getParametersByName({
 *     '/my-parameter-1': {}, // Use default options (no transformation)
 *     '/my-parameter-2': { transform: 'json' }, // Parse the value as JSON
 *     '/my-parameter-3': { transform: 'binary' }, // Parse the value as base64-encoded binary data
 *   });
 * };
 * ```
 *
 * For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use the {@link SSMProvider} class.
 *
 * The `throwOnError` parameter decides whether to throw an error if a parameter is not found:
 * - A) Default fail-fast behavior: Throws a `GetParameterError` error upon any failure.
 * - B) Gracefully aggregate all parameters that failed under "_errors" key.
 *
 * It transparently uses GetParameter and/or getParametersByName depending on decryption requirements.
 *
 * ```sh
 *                                ┌────────────────────────┐
 *                            ┌───▶  Decrypt entire batch  │─────┐
 *                            │   └────────────────────────┘     │     ┌────────────────────┐
 *                            │                                  ├─────▶ getParametersByName API  │
 *    ┌──────────────────┐    │   ┌────────────────────────┐     │     └────────────────────┘
 *    │   Split batch    │─── ┼──▶│ No decryption required │─────┘
 *    └──────────────────┘    │   └────────────────────────┘
 *                            │                                        ┌────────────────────┐
 *                            │   ┌────────────────────────┐           │  GetParameter API  │
 *                            └──▶│Decrypt some but not all│───────────▶────────────────────┤
 *                                └────────────────────────┘           │ getParametersByName API  │
 *                                                                     └────────────────────┘
 * ```
 *
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
 *
 * @param parameters - The path of the parameters to retrieve
 * @param options - Options to configure the provider
 * @param options.maxAge - Maximum age of the value in the cache, in seconds. Will be applied after the first API call.
 * @param options.transform - Whether to transform the value before returning it. Supported values: `json`, `binary`
 * @param options.decrypt - Whether to decrypt the values before returning them. If true, will use `GetParameter` API for each parameter. If false (default), will use `GetParametersByName` API.
 * @param options.throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error (default: `true`)
 */
const getParametersByName = <ExplicitUserProvidedType = undefined>(
  parameters: Record<string, SSMGetParametersByNameOptions>,
  options?: NonNullable<SSMGetParametersByNameOptions>
): Promise<SSMGetParametersByNameOutput<ExplicitUserProvidedType>> => {
  if (!Object.hasOwn(DEFAULT_PROVIDERS, 'ssm')) {
    DEFAULT_PROVIDERS.ssm = new SSMProvider();
  }

  return (DEFAULT_PROVIDERS.ssm as SSMProvider).getParametersByName(
    parameters,
    options
  ) as Promise<SSMGetParametersByNameOutput<ExplicitUserProvidedType>>;
};

export { getParametersByName };
