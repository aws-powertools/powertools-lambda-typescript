import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { BaseProvider } from '../base/BaseProvider.js';
import type {
  SecretsGetOptions,
  SecretsGetOutput,
  SecretsProviderOptions,
} from '../types/SecretsProvider.js';

/**
 * The Parameters utility provides a `SecretsProvider` that allows to retrieve secrets from AWS Secrets Manager.
 *
 * This utility supports AWS SDK v3 for JavaScript only (`@aws-sdk/client-secrets-manager`). This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * **Basic usage**
 *
 * @example
 * ```typescript
 * import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
 *
 * const secretsProvider = new SecretsProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret
 *   const secret = await secretsProvider.get('my-secret');
 * };
 * ```
 *
 * If you want to retrieve secrets without customizing the provider, you can use the {@link getSecret} function instead.
 *
 * **Caching**
 *
 * By default, the provider will cache parameters retrieved in-memory for 5 seconds.
 * You can adjust how long values should be kept in cache by using the `maxAge` parameter.
 *
 * @example
 * ```typescript
 * import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
 *
 * const secretsProvider = new SecretsProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret and cache it for 10 seconds
 *   const secret = await secretsProvider.get('my-secret', { maxAge: 10 });
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
 *
 * const secretsProvider = new SecretsProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret and always fetch the latest value
 *   const secret = await secretsProvider.get('my-secret', { forceFetch: true });
 * };
 * ```
 *
 * **Transformations**
 *
 * For parameters stored in JSON or Base64 format, you can use the transform argument for deserialization.
 *
 * @example
 * ```typescript
 * import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
 *
 * const secretsProvider = new SecretsProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret and parse it as JSON
 *   const secret = await secretsProvider.get('my-secret', { transform: 'json' });
 * };
 * ```
 *
 * **Extra SDK options**
 *
 * When retrieving a secret, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
 *
 * const secretsProvider = new SecretsProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a secret and pass extra options to the AWS SDK v3 for JavaScript client
 *   const secret = await secretsProvider.get('my-secret', {
 *     sdkOptions: {
 *       VersionId: 1,
 *     },
 *   });
 * };
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript Secrets Manager client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/interfaces/getsecretvaluecommandinput.html).
 *
 * **Customize AWS SDK v3 for JavaScript client**
 *
 * By default, the provider will create a new Secrets Manager client using the default configuration.
 *
 * You can customize the client by passing a custom configuration object to the provider.
 *
 * @example
 * ```typescript
 * import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
 *
 * const secretsProvider = new SecretsProvider({
 *  clientConfig: { region: 'eu-west-1' },
 * });
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript Secrets Manager client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/interfaces/secretsmanagerclientconfig.html).
 *
 * Otherwise, if you want to use a custom client altogether, you can pass it to the provider.
 *
 * @example
 * ```typescript
 * import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
 * import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
 *
 * const client = new SecretsManagerClient({ region: 'eu-west-1' });
 * const secretsProvider = new SecretsProvider({
 *  awsSdkV3Client: client,
 * });
 * ```
 *
 * This object must be an instance of the [AWS SDK v3 for JavaScript Secrets Manager client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/classes/secretsmanagerclient.html).
 *
 * For more usage examples, see [our documentation](https://docs.aws.amazon.com/powertools/typescript/latest/features/parameters/).
 *
 * @see https://docs.aws.amazon.com/powertools/typescript/latest/features/parameters/
 */
class SecretsProvider extends BaseProvider {
  public declare client: SecretsManagerClient;

  public constructor(config?: NonNullable<SecretsProviderOptions>) {
    super({
      awsSdkV3ClientPrototype: SecretsManagerClient as new (
        config?: unknown
      ) => SecretsManagerClient,
      ...(config ?? {}),
    });
  }

  /**
   * Retrieve a secret from AWS Secrets Manager.
   *
   * @example
   * ```typescript
   * import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
   *
   * const secretsProvider = new SecretsProvider();
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve a secret
   *   const secret = await secretsProvider.get('my-secret');
   * };
   * ```
   *
   * @see https://docs.aws.amazon.com/powertools/typescript/latest/features/parameters/
   *
   * @param name - The name of the secret to retrieve
   * @param options - Optional options to configure the provider
   * @param options.maxAge - Optional maximum age of the value in the cache, in seconds (default: `5`)
   * @param options.forceFetch - Optional flag to always fetch a new value from the store regardless if already available in cache (default: `false`)
   * @param options.transform - Optional transform to be applied, can be `json` or `binary`
   * @param options.sdkOptions - Optional additional options to pass to the AWS SDK v3 client, supports all options from {@link GetSecretValueCommandInput | `GetSecretValueCommandInput`} except `SecretId`
   */
  public get<
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
  > {
    return super.get(name, options) as Promise<
      | SecretsGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>
      | undefined
    >;
  }

  /**
   * Retrieving multiple secrets is not supported with AWS Secrets Manager.
   */
  /* v8 ignore start */ public async getMultiple(
    path: string,
    _options?: unknown
  ): Promise<void> {
    await super.getMultiple(path);
  } /* v8 ignore stop */

  /**
   * Retrieve a secret from AWS Secrets Manager.
   *
   * @param name - Name of the secret or its ID
   * @param options - SDK options to propagate to the AWS SDK v3 for JavaScript client
   * @param options.sdkOptions - Extra options to pass to the AWS SDK v3 for JavaScript client, accepts the same options as {@link GetSecretValueCommandInput | `GetSecretValueCommandInput`} except `SecretId`.
   */
  protected async _get(
    name: string,
    options?: NonNullable<SecretsGetOptions>
  ): Promise<string | Uint8Array | undefined> {
    const sdkOptions: GetSecretValueCommandInput = {
      ...(options?.sdkOptions || {}),
      SecretId: name,
    };

    const result = await this.client.send(
      new GetSecretValueCommand(sdkOptions)
    );

    if (result.SecretString) return result.SecretString;

    return result.SecretBinary;
  }

  /**
   * Retrieving multiple secrets is not supported with AWS Secrets Manager.
   *
   * @throws Not Implemented Error.
   */
  protected _getMultiple(
    _path: string,
    _options?: unknown
  ): Promise<Record<string, unknown> | undefined> {
    throw new Error('Method not implemented.');
  }
}

export { SecretsProvider };
