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

interface SSMProviderOptionsWithClientConfig {
  clientConfig?: SSMClientConfig
  awsSdkV3Client?: never
}

interface SSMProviderOptionsWithClientInstance {
  awsSdkV3Client?: SSMClient
  clientConfig?: never
}

type SSMProviderOptions = SSMProviderOptionsWithClientConfig | SSMProviderOptionsWithClientInstance;

/**
 * Options for the SSMProvider get method.
 * 
 * @interface SSMGetOptionsInterface
 * @extends {GetOptionsInterface}
 * @property {boolean} decrypt - If true, the parameter will be decrypted.
 * @property {Partial<GetParameterCommandInput>} sdkOptions - Options for the AWS SDK.
 */
interface SSMGetOptionsInterface extends GetOptionsInterface {
  decrypt?: boolean
  sdkOptions?: Partial<GetParameterCommandInput>
}

interface SSMGetMultipleOptionsInterface extends GetMultipleOptionsInterface {
  sdkOptions?: Partial<GetParametersByPathCommandInput>
  decrypt?: boolean
  recursive?: boolean
  throwOnTransformError?: boolean
}

interface SSMGetParametersByNameOptionsInterface {
  maxAge?: number
  throwOnError?: boolean
  decrypt?: boolean
  transform?: TransformOptions
}

type SSMSplitBatchAndDecryptParametersOutputType = {
  parametersToFetchInBatch: Record<string, SSMGetParametersByNameOptionsInterface>
  parametersToDecrypt: Record<string, SSMGetParametersByNameOptionsInterface>
};

interface SSMGetParametersByNameOutputInterface {
  response: Record<string, unknown>
  errors: string[]
}

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