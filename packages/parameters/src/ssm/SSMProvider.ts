import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { getBooleanFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import type {
  GetParameterCommandInput,
  GetParametersByPathCommandInput,
  GetParametersCommandInput,
  GetParametersCommandOutput,
  PutParameterCommandInput,
  PutParameterCommandOutput,
  SSMPaginationConfiguration,
} from '@aws-sdk/client-ssm';
import {
  GetParameterCommand,
  GetParametersCommand,
  PutParameterCommand,
  paginateGetParametersByPath,
  SSMClient,
} from '@aws-sdk/client-ssm';
import { BaseProvider } from '../base/BaseProvider.js';
import { transformValue } from '../base/transformValue.js';
import { DEFAULT_MAX_AGE_SECS } from '../constants.js';
import { GetParameterError, SetParameterError } from '../errors.js';
import type {
  SSMGetMultipleOptions,
  SSMGetMultipleOutput,
  SSMGetOptions,
  SSMGetOutput,
  SSMGetParametersByNameFromCacheOutputType,
  SSMGetParametersByNameOptions,
  SSMGetParametersByNameOutput,
  SSMGetParametersByNameOutputInterface,
  SSMProviderOptions,
  SSMSetOptions,
  SSMSplitBatchAndDecryptParametersOutputType,
} from '../types/SSMProvider.js';

/**
 * The Parameters utility provides a `SSMProvider` that allows to retrieve parameters from AWS Systems Manager.
 *
 * This utility supports AWS SDK v3 for JavaScript only (`@aws-sdk/client-ssm`). This allows the utility to be modular, and you to install only
 * the SDK packages you need and keep your bundle size small.
 *
 * **Basic usage**
 *
 * Retrieve a parameter from SSM:
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter from SSM
 *   const parameter = await parametersProvider.get('/my-parameter');
 * };
 * ```
 *
 * If you want to retrieve a parameter without customizing the provider, you can use the {@link getParameter} function instead.
 *
 * You can also retrieve parameters at once. If you want to get multiple parameters under the same path, you can use the `getMultiple` method.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *  // Retrieve multiple parameters by path from SSM
 *  const parameters = await parametersProvider.getMultiple('/my-parameters-path');
 * };
 * ```
 *
 * If you don't need to customize the provider, you can also use the {@link getParameters} function instead.
 *
 * If instead you want to retrieve multiple parameters by name, you can use the `getParametersByName` method.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve multiple parameters by name from SSM
 *   const parameters = await parametersProvider.getParametersByName({
 *     '/my-parameter-1': {}, // Use default options
 *     '/my-parameter-2': { transform: 'json' }, // Parse the value as JSON
 *   });
 * };
 * ```
 *
 * If you don't need to customize the provider, you can also use the {@link getParametersByName} function instead.
 *
 * **Caching**
 *
 * By default, the provider will cache parameters retrieved in-memory for 5 seconds.
 * You can adjust how long values should be kept in cache by using the `maxAge` parameter.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and cache it for 10 seconds
 *   const parameter = await parametersProvider.get('/my-parameter', { maxAge: 10 });
 *   // Retrieve multiple parameters by path and cache them for 20 seconds
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { maxAge: 20 });
 * };
 * ```
 *
 * When using the `getParametersByName` method, you can set a different `maxAge` for each parameter or set a default `maxAge` for all parameters.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve multiple parameters by name and cache them individually
 *   const parameters = await parametersProvider.getParametersByName({
 *     '/my-parameter-1': { maxAge: 10 }, // Cache for 10 seconds
 *     '/my-parameter-2': { maxAge: 20 }, // Cache for 20 seconds
 *   });
 *   // Retrieve multiple parameters by name and cache them all for 20 seconds
 *   const parameters = await parametersProvider.getParametersByName({
 *     '/my-parameter-1': {},
 *     '/my-parameter-2': {},
 *   }, { maxAge: 20 });
 * };
 * ```
 *
 * If instead you'd like to always ensure you fetch the latest parameter from the store regardless if already available in cache, use the `forceFetch` parameter.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and skip cache
 *   const parameter = await parametersProvider.get('/my-parameter', { forceFetch: true });
 *   // Retrieve multiple parameters and skip cache
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { forceFetch: true });
 * };
 * ```
 *
 * Likewise, you can use the `forceFetch` parameter with the `getParametersByName` method both for individual parameters and for all parameters.
 *
 * **Decryption**
 *
 * If you want to retrieve a parameter that is encrypted, you can use the `decrypt` parameter. This parameter is compatible with `get`, `getMultiple` and `getParametersByName`.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and decrypt it
 *   const parameter = await parametersProvider.get('/my-parameter', { decrypt: true });
 *   // Retrieve multiple parameters and decrypt them
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { decrypt: true });
 * };
 * ```
 *
 * **Transformations**
 *
 * For parameters stored as JSON you can use the transform argument for deserialization. This will return a JavaScript object instead of a string.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and parse it as JSON
 *   const parameter = await parametersProvider.get('/my-parameter', { transform: 'json' });
 *   // Retrieve multiple parameters and parse them as JSON
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { transform: 'json' });
 * };
 * ```
 *
 * For parameters that are instead stored as base64-encoded binary data, you can use the transform argument set to `binary` for decoding. This will return a decoded string.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a base64-encoded string and decode it
 *   const parameter = await parametersProvider.get('/my-parameter', { transform: 'binary' });
 *   // Retrieve multiple base64-encoded strings and decode them
 *   const parameters = await parametersProvider.getMultiple('/my-parameters-path', { transform: 'binary' });
 * };
 * ```
 *
 * Both type of transformations are compatible also with the `getParametersByName` method.
 *
 * **Extra SDK options**
 *
 * When retrieving parameters, you can pass extra options to the AWS SDK v3 for JavaScript client by using the `sdkOptions` parameter.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider();
 *
 * export const handler = async (): Promise<void> => {
 *   // Retrieve a parameter and pass extra options to the AWS SDK v3 for JavaScript client
 *   const parameter = await parametersProvider.get('/my-parameter', {
 *     sdkOptions: {
 *       WithDecryption: true,
 *     },
 *   });
 * };
 * ```
 *
 * The objects accept the same options as respectively the [AWS SDK v3 for JavaScript GetParameter command](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/getparametercommand.html) and the [AWS SDK v3 for JavaScript GetParametersByPath command](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/getparametersbypathcommand.html).
 *
 * **Customize AWS SDK v3 for JavaScript client**
 *
 * By default, the provider will create a new SSM client using the default configuration.
 *
 * You can customize the client by passing a custom configuration object to the provider.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 *
 * const parametersProvider = new SSMProvider({
 *   clientConfig: { region: 'eu-west-1' },
 * });
 * ```
 *
 * This object accepts the same options as the [AWS SDK v3 for JavaScript SSM client constructor](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/ssmclient.html#constructor).
 *
 * Otherwise, if you want to use a custom client altogether, you can pass it to the provider.
 *
 * @example
 * ```typescript
 * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
 * import { SSMClient } from '@aws-sdk/client-ssm';
 *
 * const client = new SSMClient({ region: 'eu-west-1' });
 * const parametersProvider = new SSMProvider({
 *   awsSdkV3Client: client,
 * });
 * ```
 *
 * This object must be an instance of the [AWS SDK v3 for JavaScript SSM client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ssm/classes/ssmclient.html).
 *
 * For more usage examples, see [our documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/).
 */
class SSMProvider extends BaseProvider {
  public declare client: SSMClient;
  protected errorsKey = '_errors';
  protected maxGetParametersItems = 10;

  public constructor(config?: SSMProviderOptions) {
    super({
      awsSdkV3ClientPrototype: SSMClient as new (config?: unknown) => SSMClient,
      ...(config ?? {}),
    });
  }

  /**
   * Retrieve a value from AWS Systems Manager.
   *
   * @example
   * ```typescript
   * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
   *
   * const parametersProvider = new SSMProvider();
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve a parameter from SSM
   *   const parameter = await parametersProvider.get('/my-parameter');
   * };
   * ```

   * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
   *
   * @param name - The name of the parameter to retrieve
   * @param options - Optional options to configure the provider
   * @param options.maxAge - Optional maximum age of the value in the cache, in seconds (default: `5`)
   * @param options.forceFetch - Optional flag to always fetch a new value from the store regardless if already available in cache (default: `false`)
   * @param options.transform - Optional transform to be applied, can be `json` or `binary`
   * @param options.sdkOptions - Optional additional options to pass to the AWS SDK v3 client, supports all options from {@link GetParameterCommandInput | `GetParameterCommandInput`} except `Name`
   * @param options.decrypt - Optional flag to decrypt the value before returning it (default: `false`)
   */
  public get<
    ExplicitUserProvidedType = undefined,
    InferredFromOptionsType extends SSMGetOptions | undefined = SSMGetOptions,
  >(
    name: string,
    options?: NonNullable<InferredFromOptionsType & SSMGetOptions>
  ): Promise<
    SSMGetOutput<ExplicitUserProvidedType, InferredFromOptionsType> | undefined
  > {
    return super.get(name, options) as Promise<
      | SSMGetOutput<ExplicitUserProvidedType, InferredFromOptionsType>
      | undefined
    >;
  }

  /**
   * Sets a parameter in AWS Systems Manager (SSM).
   *
   * @example
   * ```typescript
   * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
   *
   * const parametersProvider = new SSMProvider();
   *
   * export const handler = async (): Promise<void> => {
   *   // Set a parameter in SSM
   *   const version = await parametersProvider.set('/my-parameter', { value: 'my-value' });
   *   console.log(`Parameter version: ${version}`);
   * };
   * ```
   *
   * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
   *
   * @param name - The name of the parameter
   * @param options - Options to configure the parameter
   * @param options.value - The value of the parameter
   * @param options.overwrite - Whether to overwrite the value if it already exists (default: `false`)
   * @param options.description - The description of the parameter
   * @param options.parameterType - The type of the parameter, can be one of `String`, `StringList`, or `SecureString` (default: `String`)
   * @param options.tier - The parameter tier to use, can be one of `Standard`, `Advanced`, and `Intelligent-Tiering` (default: `Standard`)
   * @param options.kmsKeyId - The KMS key id to use to encrypt the parameter
   * @param options.sdkOptions - Extra options to pass to the AWS SDK v3 for JavaScript client
   */
  public async set<
    InferredFromOptionsType extends SSMSetOptions | undefined = SSMSetOptions,
  >(
    name: string,
    options: InferredFromOptionsType & SSMSetOptions
  ): Promise<number> {
    const sdkOptions: PutParameterCommandInput = {
      Tier: options.tier ?? 'Standard',
      Type: options.parameterType ?? 'String',
      Overwrite: options.overwrite ?? false,
      ...(options.kmsKeyId ? { KeyId: options.kmsKeyId } : {}),
      ...(options.description ? { Description: options.description } : {}),
      ...(options?.sdkOptions ?? {}),
      Name: name,
      Value: options.value,
    };
    let result: PutParameterCommandOutput;
    try {
      result = await this.client.send(new PutParameterCommand(sdkOptions));
    } catch (error) {
      throw new SetParameterError(`Unable to set parameter with name ${name}`, {
        cause: error,
      });
    }

    return result.Version as number;
  }

  /**
   * Retrieve multiple values from AWS Systems Manager.
   *
   * @example
   * ```typescript
   * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
   *
   * const parametersProvider = new SSMProvider();
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve multiple parameters from SSM
   *   const parameters = await parametersProvider.getMultiple('/my-parameters-path');
   * };
   * ```
   *
   * For usage examples check {@link SSMProvider | `SSMProvider`}.
   *
   * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
   *
   * @param path - The path of the parameters to retrieve
   * @param options - Optional options to configure the retrieval
   * @param options.maxAge - Optional maximum age of the value in the cache, in seconds (default: `5`)
   * @param options.forceFetch - Optional flag to always fetch a new value from the store regardless if already available in cache (default: `false`)
   * @param options.transform - Optional transform to be applied, can be `json` or `binary`
   * @param options.sdkOptions - Optional additional options to pass to the AWS SDK v3 client, supports all options from {@link GetParametersByPathCommandInput | `GetParametersByPathCommandInput`} except `Path`
   * @param options.throwOnTransformError - Optional flag to throw an error if the transform fails (default: `true`)
   * @param options.decrypt - Optional flag to decrypt the value before returning it (default: `false`)
   * @param options.recursive - Optional flag to recursively retrieve all parameters under the given path (default: `false`)
   */
  public getMultiple<
    ExplicitUserProvidedType = undefined,
    InferredFromOptionsType extends
      | SSMGetMultipleOptions
      | undefined = undefined,
  >(
    path: string,
    options?: NonNullable<InferredFromOptionsType & SSMGetMultipleOptions>
  ): Promise<
    | SSMGetMultipleOutput<ExplicitUserProvidedType, InferredFromOptionsType>
    | undefined
  > {
    return super.getMultiple(path, options) as Promise<
      | SSMGetMultipleOutput<ExplicitUserProvidedType, InferredFromOptionsType>
      | undefined
    >;
  }

  /**
   * Retrieve multiple parameters by name from AWS Systems Manager.
   *
   * @example
   * ```typescript
   * import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';
   *
   * const parametersProvider = new SSMProvider();
   *
   * export const handler = async (): Promise<void> => {
   *   // Retrieve multiple parameters by name from SSM
   *   const parameters = await parametersProvider.getParametersByName({
   *     '/my-parameter-1': {}, // Use default options
   *     '/my-parameter-2': { transform: 'json' }, // Parse the value as JSON
   *   });
   * };
   * ```
   *
   * The `throwOnError` option decides whether to throw an error if a parameter is not found:
   * - A) Default fail-fast behavior: Throws a `GetParameterError` error upon any failure.
   * - B) Gracefully aggregate all parameters that failed under "_errors" key.
   *
   * It transparently uses GetParameter and/or GetParameters depending on decryption requirements.
   *
   * ```sh
   *                                ┌────────────────────────┐
   *                            ┌───▶  Decrypt entire batch  │─────┐
   *                            │   └────────────────────────┘     │     ┌────────────────────┐
   *                            │                                  ├─────▶ GetParameters API  │
   *    ┌──────────────────┐    │   ┌────────────────────────┐     │     └────────────────────┘
   *    │   Split batch    │─── ┼──▶│ No decryption required │─────┘
   *    └──────────────────┘    │   └────────────────────────┘
   *                            │                                        ┌────────────────────┐
   *                            │   ┌────────────────────────┐           │  GetParameter API  │
   *                            └──▶│Decrypt some but not all│───────────▶────────────────────┤
   *                                └────────────────────────┘           │ GetParameters API  │
   *                                                                     └────────────────────┘
   * ```
   *
   * @see https://docs.powertools.aws.dev/lambda/typescript/latest/features/parameters/
   *
   * @param parameters - Object containing parameter names and any optional overrides
   * @param options - Options to configure the retrieval
   * @param options.maxAge - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * @param options.transform - Whether to transform the value before returning it. Supported values: `json`, `binary`
   * @param options.decrypt - Whether to decrypt the value before returning it.
   * @param options.throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error (default: `true`)
   */
  public async getParametersByName<ExplicitUserProvidedType = undefined>(
    parameters: Record<string, SSMGetParametersByNameOptions>,
    options?: NonNullable<SSMGetParametersByNameOptions>
  ): Promise<SSMGetParametersByNameOutput<ExplicitUserProvidedType>> {
    const configs = {
      ...{
        decrypt: this.resolveDecryptionConfigValue({}) || false,
        maxAge: DEFAULT_MAX_AGE_SECS,
        throwOnError: true,
      },
      ...options,
    };

    let response: Record<string, unknown> = {};

    // NOTE: We fail early to avoid unintended graceful errors being replaced with their '_errors' param values
    SSMProvider.throwIfErrorsKeyIsPresent(
      parameters,
      this.errorsKey,
      configs.throwOnError
    );

    const { parametersToFetchInBatch, parametersToDecrypt } =
      SSMProvider.splitBatchAndDecryptParameters(parameters, configs);
    // NOTE: We need to find out whether all parameters must be decrypted or not to know which API to use
    // Logic:
    // GetParameters API -> When decrypt is used for all parameters in the the batch
    // GetParameter  API -> When decrypt is used for one or more in the batch
    if (
      Object.keys(parametersToDecrypt).length !== Object.keys(parameters).length
    ) {
      const { response: decryptResponse, errors: decryptErrors } =
        await this.getParametersByNameWithDecryptOption(
          parametersToDecrypt,
          configs.throwOnError
        );
      const { response: batchResponse, errors: batchErrors } =
        await this.getParametersBatchByName(
          parametersToFetchInBatch,
          configs.throwOnError,
          false
        );

      response = { ...decryptResponse, ...batchResponse };
      // Fail-fast disabled, let's aggregate errors under "_errors" key so they can handle gracefully
      if (!configs.throwOnError) {
        response[this.errorsKey] = [...decryptErrors, ...batchErrors];
      }
    } else {
      const { response: batchResponse, errors: batchErrors } =
        await this.getParametersBatchByName(
          parametersToDecrypt,
          configs.throwOnError,
          true
        );

      response = batchResponse;
      // Fail-fast disabled, let's aggregate errors under "_errors" key so they can handle gracefully
      if (!configs.throwOnError) {
        response[this.errorsKey] = [...batchErrors];
      }
    }

    return response as unknown as Promise<
      SSMGetParametersByNameOutput<ExplicitUserProvidedType>
    >;
  }

  /**
   * Retrieve a parameter from AWS Systems Manager.
   *
   * @param name - Name of the parameter to retrieve
   * @param options - Options to customize the retrieval
   * @param options.sdkOptions - Extra options to pass to the AWS SDK v3 for JavaScript client
   * @param options.decrypt - Whether to decrypt the value before returning it.
   * @param options.transform - Whether to transform the value before returning it. Supported values: `json`, `binary`, or `auto` (default: `undefined`)
   */
  protected async _get(
    name: string,
    options?: NonNullable<SSMGetOptions>
  ): Promise<string | undefined> {
    const sdkOptions: GetParameterCommandInput = {
      ...(options?.sdkOptions || {}),
      Name: name,
    };
    sdkOptions.WithDecryption = this.resolveDecryptionConfigValue(
      options,
      sdkOptions
    );
    const result = await this.client.send(new GetParameterCommand(sdkOptions));

    return result.Parameter?.Value;
  }

  /**
   * Retrieve multiple items from AWS Systems Manager.
   *
   * @param path - The path of the parameters to retrieve
   * @param options - Options to configure the provider
   * @param options.maxAge - The maximum age of the value in cache before fetching a new one (in seconds) (default: 5)
   * @param options.forceFetch - Whether to always fetch a new value from the store regardless if already available in cache
   * @param options.transform - Whether to transform the value before returning it. Supported values: `json`, `binary`
   * @param options.sdkOptions - Extra options to pass to the AWS SDK v3 for JavaScript client
   * @param options.throwOnTransformError - Whether to throw an error if the transform fails (default: `true`)
   * @param options.decrypt - Whether to decrypt the value before returning it.
   * @param options.recursive - Whether to recursively retrieve all parameters under the given path (default: `false`)
   */
  protected async _getMultiple(
    path: string,
    options?: NonNullable<SSMGetMultipleOptions>
  ): Promise<Record<string, string | undefined>> {
    const sdkOptions: GetParametersByPathCommandInput = {
      ...(options?.sdkOptions || {}),
      Path: path,
    };
    const paginationOptions: SSMPaginationConfiguration = {
      client: this.client,
    };
    sdkOptions.WithDecryption = this.resolveDecryptionConfigValue(
      options,
      sdkOptions
    );
    sdkOptions.Recursive =
      options?.recursive !== undefined
        ? options.recursive
        : sdkOptions.Recursive;
    paginationOptions.pageSize =
      sdkOptions.MaxResults !== undefined ? sdkOptions.MaxResults : undefined;

    const parameters: Record<string, string | undefined> = {};
    for await (const page of paginateGetParametersByPath(
      paginationOptions,
      sdkOptions
    )) {
      for (const parameter of page.Parameters || []) {
        /**
         * Standardize the parameter name
         *
         * The parameter name returned by SSM will contain the full path.
         * However, for readability, we should return only the part after the path.
         */
        // biome-ignore lint/style/noNonNullAssertion: If the parameter is present in the response, then it has a Name
        let name = parameter.Name!;
        name = name.replace(path, '');
        if (name.startsWith('/')) {
          name = name.replace('/', '');
        }
        parameters[name] = parameter.Value;
      }
    }

    return parameters;
  }

  /**
   * Retrieve multiple items by name from AWS Systems Manager.
   *
   * @param parameters - An object of parameter names and their options
   * @param throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   * @param decrypt - Whether to decrypt the parameters or not
   */
  protected async _getParametersByName(
    parameters: Record<string, SSMGetParametersByNameOptions>,
    throwOnError: boolean,
    decrypt: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    const sdkOptions: GetParametersCommandInput = {
      Names: Object.keys(parameters),
    };
    if (decrypt) {
      sdkOptions.WithDecryption = true;
    }

    const result = await this.client.send(new GetParametersCommand(sdkOptions));
    const errors = SSMProvider.handleAnyInvalidGetParameterErrors(
      result,
      throwOnError
    );
    const response = this.transformAndCacheGetParametersResponse(
      result,
      parameters,
      throwOnError
    );

    return {
      response,
      errors,
    };
  }

  /**
   * Slice batch and fetch parameters using GetPrameters API by max permissible batch size
   *
   * @param parameters - An object of parameter names and their options
   * @param throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   * @param decrypt - Whether to decrypt the parameters or not
   */
  protected async getParametersBatchByName(
    parameters: Record<string, SSMGetParametersByNameOptions>,
    throwOnError: boolean,
    decrypt: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    let response: Record<string, unknown> = {};
    let errors: string[] = [];

    // Fetch each possible batch param from cache and return if entire batch is cached
    const { cached, toFetch } = this.getParametersByNameFromCache(parameters);
    if (Object.keys(cached).length >= Object.keys(parameters).length) {
      response = cached;

      return {
        response,
        errors,
      };
    }

    // Slice batch by max permitted GetParameters call and retrieve the ones that are not cached
    const { response: batchResponse, errors: batchErrors } =
      await this.getParametersByNameInChunks(toFetch, throwOnError, decrypt);
    response = { ...cached, ...batchResponse };
    errors = batchErrors;

    return {
      response,
      errors,
    };
  }

  /**
   * Fetch each parameter from batch that hasn't expired from cache
   *
   * @param parameters - An object of parameter names and their options
   */
  protected getParametersByNameFromCache(
    parameters: Record<string, SSMGetParametersByNameOptions>
  ): SSMGetParametersByNameFromCacheOutputType {
    const cached: Record<string, string | Record<string, unknown>> = {};
    const toFetch: Record<string, SSMGetParametersByNameOptions> = {};

    for (const [parameterName, parameterOptions] of Object.entries(
      parameters
    )) {
      const cacheKey = [parameterName, parameterOptions.transform].toString();
      if (!this.hasKeyExpiredInCache(cacheKey)) {
        // biome-ignore lint/style/noNonNullAssertion: Since we know the key exists in the cache, we can safely use the non-null assertion operator
        cached[parameterName] = this.store.get(cacheKey)!.value as Record<
          string,
          string | Record<string, unknown>
        >;
      } else {
        toFetch[parameterName] = parameterOptions;
      }
    }

    return {
      cached,
      toFetch,
    };
  }

  /**
   * Slice object into chunks of max permissible batch size and fetch parameters
   *
   * @param parameters - An object of parameter names and their options
   * @param throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   * @param decrypt - Whether to decrypt the parameters or not
   */
  protected async getParametersByNameInChunks(
    parameters: Record<string, SSMGetParametersByNameOptions>,
    throwOnError: boolean,
    decrypt: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    let response: Record<string, unknown> = {};
    let errors: string[] = [];

    // Slice object into chunks of max permissible batch size
    const chunks = Object.entries(parameters).reduce(
      (acc, [parameterName, parameterOptions], index) => {
        const chunkIndex = Math.floor(index / this.maxGetParametersItems);
        if (!acc[chunkIndex]) {
          acc[chunkIndex] = {};
        }
        acc[chunkIndex][parameterName] = parameterOptions;

        return acc;
      },
      [] as Record<string, SSMGetParametersByNameOptions>[]
    );

    // Fetch each chunk and merge results
    for (const chunk of chunks) {
      const { response: chunkResponse, errors: chunkErrors } =
        await this._getParametersByName(chunk, throwOnError, decrypt);

      response = { ...response, ...chunkResponse };
      errors = [...errors, ...chunkErrors];
    }

    return {
      response,
      errors,
    };
  }

  /**
   * Fetch parameters by name while also decrypting them
   *
   * @param parameters - An object of parameter names and their options
   * @param throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   */
  protected async getParametersByNameWithDecryptOption(
    parameters: Record<string, SSMGetParametersByNameOptions>,
    throwOnError: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    const response: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const [parameterName, parameterOptions] of Object.entries(
      parameters
    )) {
      try {
        response[parameterName] = await this._get(
          parameterName,
          parameterOptions
        );
      } catch (error) {
        if (throwOnError) {
          throw error;
        }
        errors.push(parameterName);
      }
    }

    return {
      response,
      errors,
    };
  }

  /**
   * Handle any invalid parameters returned by GetParameters API.
   *
   * GetParameters is non-atomic. Failures don't always reflect in exceptions so we need to collect.
   *
   * @param result - The result of the GetParameters API call
   * @param throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   */
  protected static handleAnyInvalidGetParameterErrors(
    result: Partial<GetParametersCommandOutput>,
    throwOnError: boolean
  ): string[] {
    const errors: string[] = [];
    if (result.InvalidParameters && result.InvalidParameters.length > 0) {
      if (throwOnError) {
        throw new GetParameterError(
          `Failed to fetch parameters: ${result.InvalidParameters.join(', ')}`
        );
      }
      errors.push(...result.InvalidParameters);
    }

    return errors;
  }

  protected resolveDecryptionConfigValue(
    options: SSMGetOptions | SSMGetMultipleOptions = {},
    sdkOptions?: GetParameterCommandInput | GetParametersByPathCommandInput
  ): boolean | undefined {
    if (options?.decrypt !== undefined) return options.decrypt;
    if (sdkOptions?.WithDecryption !== undefined)
      return sdkOptions.WithDecryption;

    return getBooleanFromEnv({
      key: 'POWERTOOLS_PARAMETERS_SSM_DECRYPT',
      defaultValue: false,
      extendedParsing: true,
    });
  }

  /**
   * Split parameters that can be fetched by GetParameters vs GetParameter.
   *
   * @param parameters - An object of parameter names and their options
   * @param configs - The configs passed down
   */
  protected static splitBatchAndDecryptParameters(
    parameters: Record<string, SSMGetParametersByNameOptions>,
    configs: SSMGetParametersByNameOptions
  ): SSMSplitBatchAndDecryptParametersOutputType {
    const parametersToFetchInBatch: Record<
      string,
      SSMGetParametersByNameOptions
    > = {};
    const parametersToDecrypt: Record<string, SSMGetParametersByNameOptions> =
      {};

    for (const [parameterName, parameterOptions] of Object.entries(
      parameters
    )) {
      const overrides = parameterOptions;
      overrides.transform = overrides.transform || configs.transform;

      overrides.decrypt =
        overrides.decrypt !== undefined ? overrides.decrypt : configs.decrypt;
      overrides.maxAge =
        overrides.maxAge !== undefined ? overrides.maxAge : configs.maxAge;

      if (overrides.decrypt) {
        parametersToDecrypt[parameterName] = overrides;
      } else {
        parametersToFetchInBatch[parameterName] = overrides;
      }
    }

    return {
      parametersToFetchInBatch,
      parametersToDecrypt,
    };
  }

  /**
   * Throw a GetParameterError if fail-fast is disabled and `_errors` key is in parameters list.
   *
   * @param parameters - An object of parameter names and their options
   * @param reservedParameter - The reserved parameter name that cannot be used when fail-fast is disabled
   * @param throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   */
  protected static throwIfErrorsKeyIsPresent(
    parameters: Record<string, unknown>,
    reservedParameter: string,
    throwOnError: boolean
  ): void {
    if (!throwOnError && Object.hasOwn(parameters, reservedParameter)) {
      throw new GetParameterError(
        `You cannot fetch a parameter named ${reservedParameter} in graceful error mode.`
      );
    }
  }

  /**
   * Transform and cache the response from GetParameters API call
   *
   * @param response - The response from the GetParameters API call
   * @param parameters - An object of parameter names and their options
   * @param throwOnError - Whether to throw an error if any of the parameters' retrieval throws an error or handle them gracefully
   */
  protected transformAndCacheGetParametersResponse(
    response: Partial<GetParametersCommandOutput>,
    parameters: Record<string, SSMGetParametersByNameOptions>,
    throwOnError: boolean
  ): Record<string, unknown> {
    const processedParameters: Record<string, unknown> = {};

    for (const parameter of response.Parameters || []) {
      // biome-ignore lint/style/noNonNullAssertion: If the parameter is present in the response, then it has a Name
      const parameterName = parameter.Name!;
      const parameterValue = parameter.Value;
      const parameterOptions = parameters[parameterName];

      let value: string | JSONValue | Uint8Array | undefined;
      // NOTE: if transform is set, we do it before caching to reduce number of operations
      if (parameterValue && parameterOptions.transform) {
        value = transformValue(
          parameterValue,
          parameterOptions.transform,
          throwOnError,
          parameterName
        );
      } else if (parameterValue) {
        value = parameterValue;
      }

      if (value) {
        const cacheKey = [parameterName, parameterOptions.transform].toString();
        this.addToCache(
          cacheKey,
          value,
          parameterOptions.maxAge || DEFAULT_MAX_AGE_SECS
        );
      }

      processedParameters[parameterName] = value;
    }

    return processedParameters;
  }
}

export { SSMProvider };
