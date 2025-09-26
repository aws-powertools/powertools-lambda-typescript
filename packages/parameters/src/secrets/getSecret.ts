import { DEFAULT_PROVIDERS } from '../base/DefaultProviders.js';
import type {
  SecretsGetOptions,
  SecretsGetOutput,
} from '../types/SecretsProvider.js';
import { SecretsProvider } from './SecretsProvider.js';

/**
 * The Parameters utility provides a `SecretsProvider` that allows to retrieve secrets from AWS Secrets Manager.
 *
 * This utility supports AWS SDK v3 for JavaScript only. This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * **Basic usage**
 *
 * @example
 * ```typescript
 * import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret
 *   const secret = await getSecret('my-secret');
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
 * import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret and cache it for 10 seconds
 *   const secret = await getSecret('my-secret', { maxAge: 10 });
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret and always fetch the latest value
 *   const secret = await getSecret('my-secret', { forceFetch: true });
 * };
 * ```
 *
 * **Transformations**
 *
 * For parameters stored as JSON or base64-encoded strings, you can use the transform argument set to `json` or `binary` for deserialization.
 *
 * @example
 * ```typescript
 * import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret and parse it as JSON
 *   const secret = await getSecret('my-secret', { transform: 'json' });
 * };
 * ```
 *
 * **Extra SDK options**
 *
 * When retrieving a secret, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { getSecret } from '@aws-lambda-powertools/parameters/secrets';
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret and pass extra options to the AWS SDK v3 for JavaScript client
 *   const secret = await getSecret('my-secret', {
 *     sdkOptions: {
 *       VersionId: 1,
 *     },
 *   });
 * };
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript Secrets Manager client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/interfaces/getsecretvaluecommandinput.html).
 *
 * **Built-in provider class**
 *
 * For greater flexibility such as configuring the underlying SDK client used by built-in providers, you can use the {@link SecretsProvider} class.
 *
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
 *
 * @param name - The name of the secret to retrieve
 * @param options - Optional options to configure the provider
 * @param options.maxAge - Optional maximum age of the value in the cache, in seconds (default: `5`)
 * @param options.forceFetch - Optional flag to always fetch a new value from the store regardless if already available in cache (default: `false`)
 * @param options.transform - Optional transform to be applied, can be `json` or `binary`
 * @param options.sdkOptions - Optional additional options to pass to the AWS SDK v3 client, supports all options from {@link GetSecretValueCommandInput | `GetSecretValueCommandInput`} except `SecretId`
 */
const getSecret = <
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType extends
    | SecretsGetOptions
    | undefined = SecretsGetOptions,
>(
  name: string,
  options?: NonNullable<InferredFromOptionsType & SecretsGetOptions>
): Promise<
  | SecretsGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>
  | undefined
> => {
  if (!Object.hasOwn(DEFAULT_PROVIDERS, 'secrets')) {
    DEFAULT_PROVIDERS.secrets = new SecretsProvider();
  }

  return (DEFAULT_PROVIDERS.secrets as SecretsProvider).get(name, options);
};

export { getSecret };
