import type { GetParameterCommandInput, GetParametersByPathCommandInput } from '@aws-sdk/client-ssm';
import type { GetOptionsInterface, GetMultipleOptionsInterface, TransformOptions } from './BaseProvider';

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
  batch: Record<string, SSMGetParametersByNameOptionsInterface>
  decrypt: Record<string, SSMGetParametersByNameOptionsInterface>
} & { [key: string]: SSMGetParametersByNameOptionsInterface };

interface SSMGetParametersByNameOutputInterface {
  response: Record<string, unknown>
  errors: string[]
}

type SSMGetParametersByNameFromCacheOutputType = {
  cached: Record<string, string | Record<string, unknown>>
  toFetch: Record<string, SSMGetParametersByNameOptionsInterface>
} & { [key: string]: SSMGetParametersByNameOptionsInterface };

export {
  SSMGetOptionsInterface,
  SSMGetMultipleOptionsInterface,
  SSMGetParametersByNameOptionsInterface,
  SSMSplitBatchAndDecryptParametersOutputType,
  SSMGetParametersByNameOutputInterface,
  SSMGetParametersByNameFromCacheOutputType,
};