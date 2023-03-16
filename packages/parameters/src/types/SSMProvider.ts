import type {
  SSMClient,
  SSMClientConfig,
  GetParameterCommandInput,
  GetParametersByPathCommandInput
} from '@aws-sdk/client-ssm';
import type {
  GetOptionsInterface,
  GetMultipleOptionsInterface,
  TransformOptions
} from './BaseProvider';

/**
 * Interface for SSMProvider with clientConfig property.
 *
 * @interface
 * @property {SSMClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 * @property {never} [awsSdkV3Client] - This property should never be passed.
 */
interface SSMProviderOptionsWithClientConfig {
  clientConfig?: SSMClientConfig
  awsSdkV3Client?: never
}

/**
 * Interface for SSMProvider with awsSdkV3Client property.
 *
 * @interface
 * @property {SSMClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during SSMProvider class instantiation
 * @property {never} [clientConfig] - This property should never be passed.
 */
interface SSMProviderOptionsWithClientInstance {
  awsSdkV3Client?: SSMClient
  clientConfig?: never
}

/**
 * Options for the SSMProvider class constructor.
 *
 * @type SSMProviderOptions
 * @property {SSMClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with awsSdkV3Client.
 * @property {SSMClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during DynamoDBProvider class instantiation. Mutually exclusive with clientConfig.
 */
type SSMProviderOptions = SSMProviderOptionsWithClientConfig | SSMProviderOptionsWithClientInstance;

/**
 * Options for the SSMProvider getMultiple method.
 *
 * @interface SSMGetOptionsInterface
 * @extends {GetOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {GetItemCommandInput} [sdkOptions] - Additional options to pass to the AWS SDK v3 client.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 * @property {boolean} decrypt - If true, the parameter will be decrypted.
 */
interface SSMGetOptionsInterface extends GetOptionsInterface {
  decrypt?: boolean
  sdkOptions?: Partial<GetParameterCommandInput>
}

/**
 * Options for the SSMProvider getMultiple method.
 *
 * @interface SSMGetMultipleOptionsInterface
 * @extends {GetMultipleOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {GetItemCommandInput} [sdkOptions] - Additional options to pass to the AWS SDK v3 client.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 * @property {boolean} decrypt - If true, the parameter will be decrypted.
 * @property {boolean} recursive - If true, the parameter will be fetched recursively.
 * @property {boolean} throwOnTransformError - If true, the method will throw an error if the transform fails.
 */
interface SSMGetMultipleOptionsInterface extends GetMultipleOptionsInterface {
  sdkOptions?: Partial<GetParametersByPathCommandInput>
  decrypt?: boolean
  recursive?: boolean
  throwOnTransformError?: boolean
}

/**
 * Options for the SSMProvider getParametersByName method.
 *
 * @interface SSMGetParametersByNameOptionsInterface
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 * @property {boolean} decrypt - If true, the parameter will be decrypted.
 * @property {boolean} throwOnError - If true, the method will throw an error if one of the parameters cannot be fetched. Otherwise it will aggregate the errors under an _errors key in the response.
 */
interface SSMGetParametersByNameOptionsInterface {
  maxAge?: number
  throwOnError?: boolean
  decrypt?: boolean
  transform?: TransformOptions
}

/**
 * Output type for the SSMProvider splitBatchAndDecryptParameters method.
 */
type SSMSplitBatchAndDecryptParametersOutputType = {
  parametersToFetchInBatch: Record<string, SSMGetParametersByNameOptionsInterface>
  parametersToDecrypt: Record<string, SSMGetParametersByNameOptionsInterface>
};

/**
 * Output type for the SSMProvider getParametersByName method.
 */
interface SSMGetParametersByNameOutputInterface {
  response: Record<string, unknown>
  errors: string[]
}

/**
 * Output type for the SSMProvider getParametersByNameFromCache method.
 */
type SSMGetParametersByNameFromCacheOutputType = {
  cached: Record<string, string | Record<string, unknown>>
  toFetch: Record<string, SSMGetParametersByNameOptionsInterface>
};

export type {
  SSMProviderOptions,
  SSMGetOptionsInterface,
  SSMGetMultipleOptionsInterface,
  SSMGetParametersByNameOptionsInterface,
  SSMSplitBatchAndDecryptParametersOutputType,
  SSMGetParametersByNameOutputInterface,
  SSMGetParametersByNameFromCacheOutputType,
};