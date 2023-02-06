import { BaseProvider, DEFAULT_PROVIDERS, transformValue } from '../BaseProvider';
import { GetParameterError } from '../Exceptions';
import { DEFAULT_MAX_AGE_SECS } from '../constants';
import {
  SSMClient,
  GetParameterCommand,
  paginateGetParametersByPath,
  GetParametersCommand
} from '@aws-sdk/client-ssm';
import type {
  GetParameterCommandInput,
  GetParametersByPathCommandInput,
  GetParametersCommandInput,
  GetParametersCommandOutput,
} from '@aws-sdk/client-ssm';
import type {
  SSMProviderOptions,
  SSMGetMultipleOptionsInterface,
  SSMGetOptionsInterface,
  SSMGetParametersByNameOutputInterface,
  SSMGetParametersByNameOptionsInterface,
  SSMSplitBatchAndDecryptParametersOutputType,
  SSMGetParametersByNameFromCacheOutputType,
} from '../types/SSMProvider';
import type { PaginationConfiguration } from '@aws-sdk/types';

class SSMProvider extends BaseProvider {
  public client: SSMClient;
  protected errorsKey = '_errors';
  protected maxGetParametersItems = 10;

  public constructor(config?: SSMProviderOptions) {
    super();

    if (config?.awsSdkV3Client) {
      if (config?.awsSdkV3Client instanceof SSMClient) {
        this.client = config.awsSdkV3Client;
      } else {
        throw Error('Not a valid SSMClient provided');
      }
    } else {
      const clientConfig = config?.clientConfig || {};
      this.client = new SSMClient(clientConfig);
    }
  }

  public async get(
    name: string,
    options?: SSMGetOptionsInterface | undefined
  ): Promise<string | Record<string, unknown> | undefined> {
    return super.get(name, options) as Promise<string | Record<string, unknown> | undefined>;
  }

  public async getMultiple(
    path: string,
    options?: SSMGetMultipleOptionsInterface | undefined
  ): Promise<undefined | Record<string, unknown>> {
    return super.getMultiple(path, options);
  }

  /**
   * Retrieve multiple parameter values by name from SSM or cache.
   * 
   * `ThrowOnError` decides whether to throw an error if a parameter is not found:
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
   * @param {Record<string, unknown>[]} parameters - List of parameter names, and any optional overrides
   * 
   */
  public async getParametersByName(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    options?: SSMGetParametersByNameOptionsInterface
  ): Promise<Record<string, unknown>> {
    const configs = { ...{
      decrypt: false,
      maxAge: DEFAULT_MAX_AGE_SECS,
      throwOnError: true,
    }, ...options };

    let response: Record<string, unknown> = {};

    // NOTE: We fail early to avoid unintended graceful errors being replaced with their '_errors' param values
    SSMProvider.throwIfErrorsKeyIsPresent(parameters, this.errorsKey, configs.throwOnError);

    const {
      parametersToFetchInBatch,
      parametersToDecrypt
    } = SSMProvider.splitBatchAndDecryptParameters(parameters, configs);
    // NOTE: We need to find out whether all parameters must be decrypted or not to know which API to use
    // Logic:
    // GetParameters API -> When decrypt is used for all parameters in the the batch
    // GetParameter  API -> When decrypt is used for one or more in the batch
    if (Object.keys(parametersToDecrypt).length !== Object.keys(parameters).length) {
      const {
        response: decryptResponse,
        errors: decryptErrors
      } = await this.getParametersByNameWithDecryptOption(parametersToDecrypt, configs.throwOnError);
      const {
        response: batchResponse,
        errors: batchErrors
      } = await this.getParametersBatchByName(parametersToFetchInBatch, configs.throwOnError, false);
      
      response = { ...decryptResponse, ...batchResponse };
      // Fail-fast disabled, let's aggregate errors under "_errors" key so they can handle gracefully
      if (!configs.throwOnError) {
        response[this.errorsKey] = [ ...decryptErrors, ...batchErrors ];
      }
    } else {
      const {
        response: batchResponse,
        errors: batchErrors
      } = await this.getParametersBatchByName(parametersToDecrypt, configs.throwOnError, true);
      
      response = batchResponse;
      // Fail-fast disabled, let's aggregate errors under "_errors" key so they can handle gracefully
      if (!configs.throwOnError) {
        response[this.errorsKey] = [...batchErrors];
      }
    }

    return response;
  }

  protected async _get(
    name: string,
    options?: SSMGetOptionsInterface
  ): Promise<string | undefined> {
    const sdkOptions: GetParameterCommandInput = {
      Name: name,
    };
    if (options) {
      if (options.hasOwnProperty('decrypt')) sdkOptions.WithDecryption = options.decrypt;
      if (options.hasOwnProperty('sdkOptions')) {
        Object.assign(sdkOptions, options.sdkOptions);
      }
    }
    const result = await this.client.send(new GetParameterCommand(sdkOptions));

    return result.Parameter?.Value;
  }

  protected async _getMultiple(
    path: string,
    options?: SSMGetMultipleOptionsInterface
  ): Promise<Record<string, string | undefined>> {
    const sdkOptions: GetParametersByPathCommandInput = {
      Path: path,
    };
    const paginationOptions: PaginationConfiguration = {
      client: this.client
    };
    if (options) {
      if (options.hasOwnProperty('decrypt')) sdkOptions.WithDecryption = options.decrypt;
      if (options.hasOwnProperty('recursive')) sdkOptions.Recursive = options.recursive;
      if (options.hasOwnProperty('sdkOptions')) {
        Object.assign(sdkOptions, options.sdkOptions);
        if (sdkOptions.MaxResults) {
          paginationOptions.pageSize = sdkOptions.MaxResults;
        }
      }
    }
    
    const parameters: Record<string, string | undefined> = {};
    for await (const page of paginateGetParametersByPath(paginationOptions, sdkOptions)) {
      for (const parameter of page.Parameters || []) {
        /**
         * Standardize the parameter name
         *
         * The parameter name returned by SSM will contain the full path.
         * However, for readability, we should return only the part after the path. 
         **/ 
        
        // If the parameter is present in the response, then it has a Name
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

  protected async _getParametersByName(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
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
    const errors = SSMProvider.handleAnyInvalidGetParameterErrors(result, throwOnError);
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
   */
  protected async getParametersBatchByName(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    throwOnError: boolean,
    decrypt: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    let response: Record<string, unknown> = {};
    let errors: string[] = [];

    // Fetch each possible batch param from cache and return if entire batch is cached
    const { cached, toFetch } = await this.getParametersByNameFromCache(parameters);
    if (Object.keys(cached).length >= Object.keys(parameters).length) {
      response = cached;

      return {
        response,
        errors,
      };
    }

    // Slice batch by max permitted GetParameters call and retrieve the ones that are not cached
    const {
      response: batchResponse,
      errors: batchErrors
    } = await this.getParametersByNameInChunks(toFetch, throwOnError, decrypt);
    response = { ...cached, ...batchResponse };
    errors = batchErrors;

    return {
      response,
      errors,
    };
  }

  /**
   * Fetch each parameter from batch that hasn't expired from cache
   */
  protected async getParametersByNameFromCache(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>
  ): Promise<SSMGetParametersByNameFromCacheOutputType> {
    const cached: Record<string, string | Record<string, unknown>> = {};
    const toFetch: Record<string, SSMGetParametersByNameOptionsInterface> = {};

    for (const [ parameterName, parameterOptions ] of Object.entries(parameters)) {
      const cacheKey = [ parameterName, parameterOptions.transform ].toString();
      if (!this.hasKeyExpiredInCache(cacheKey)) {
        // Since we know the key exists in the cache, we can safely use the non-null assertion operator
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        cached[parameterName] = this.store.get(cacheKey)!.value as Record<string, string | Record<string, unknown>>;
      } else {
        toFetch[parameterName] = parameterOptions;
      }
    }

    return {
      cached,
      toFetch,
    };
  }

  protected async getParametersByNameInChunks(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    throwOnError: boolean,
    decrypt: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    let response: Record<string, unknown> = {};
    let errors: string[] = [];
    
    // Slice object into chunks of max permissible batch size
    const chunks = Object.entries(parameters).reduce((
      acc,
      [ parameterName, parameterOptions ],
      index
    ) => {
      const chunkIndex = Math.floor(index / this.maxGetParametersItems);
      if (!acc[chunkIndex]) {
        acc[chunkIndex] = {};
      }
      acc[chunkIndex][parameterName] = parameterOptions;

      return acc;
    }, [] as Record<string, SSMGetParametersByNameOptionsInterface>[]);

    // Fetch each chunk and merge results
    for (const chunk of chunks) {
      const {
        response: chunkResponse,
        errors: chunkErrors
      } = await this._getParametersByName(chunk, throwOnError, decrypt);
      
      response = { ...response, ...chunkResponse };
      errors = [ ...errors, ...chunkErrors ];
    }

    return {
      response,
      errors,
    };
  }

  protected async getParametersByNameWithDecryptOption(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    throwOnError: boolean
  ): Promise<SSMGetParametersByNameOutputInterface> {
    const response: Record<string, unknown> = {};
    const errors: string[] = [];

    for (const [ parameterName, parameterOptions ] of Object.entries(parameters)) {
      try {
        response[parameterName] = await this._get(parameterName, parameterOptions);
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
   * Handle any invalid parameters returned by GetParameters API
   * GetParameters is non-atomic. Failures don't always reflect in exceptions so we need to collect.
   */
  protected static handleAnyInvalidGetParameterErrors(
    result: GetParametersCommandOutput,
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

  /**
   * Split parameters that can be fetched by GetParameters vs GetParameter.
   */
  protected static splitBatchAndDecryptParameters(
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    configs: SSMGetParametersByNameOptionsInterface
  ): SSMSplitBatchAndDecryptParametersOutputType {
    const parametersToFetchInBatch: Record<string, SSMGetParametersByNameOptionsInterface> = {};
    const parametersToDecrypt: Record<string, SSMGetParametersByNameOptionsInterface> = {};

    for (const [ parameterName, parameterOptions ] of Object.entries(parameters)) {
      const overrides = parameterOptions;
      overrides.transform = overrides.transform || configs.transform;

      if (!overrides.hasOwnProperty('decrypt')) {
        overrides.decrypt = configs.decrypt;
      }
      if (!overrides.hasOwnProperty('maxAge')) {
        overrides.maxAge = configs.maxAge;
      }

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
   * @param {Record<string, unknown>} parameters 
   * @param {string} reservedParameter 
   * @param {boolean} throwOnError 
   */
  protected static throwIfErrorsKeyIsPresent(
    parameters: Record<string, unknown>,
    reservedParameter: string,
    throwOnError: boolean
  ): void {
    if (!throwOnError && parameters.hasOwnProperty(reservedParameter)) {
      throw new GetParameterError(
        `You cannot fetch a parameter named ${reservedParameter} in graceful error mode.`
      );
    }
  }

  protected transformAndCacheGetParametersResponse(
    response: GetParametersCommandOutput,
    parameters: Record<string, SSMGetParametersByNameOptionsInterface>,
    throwOnError: boolean
  ): Record<string, unknown> {
    const processedParameters: Record<string, unknown> = {};

    for (const parameter of response.Parameters || []) {
      // If the parameter is present in the response, then it has a Name
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const parameterName = parameter.Name!;
      const parameterValue = parameter.Value;
      const parameterOptions = parameters[parameterName];

      let value;
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
        const cacheKey = [ parameterName, parameterOptions.transform ].toString();
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

export {
  SSMProvider,
  DEFAULT_PROVIDERS,
};