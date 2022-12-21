import type { GetParameterCommandInput, GetParametersByPathCommandInput } from '@aws-sdk/client-ssm';
import { ExpirableValue } from 'BaseProvider';
import type { TransformOptions } from 'types/BaseProvider';

/**
 * Options for the SSMProvider get method.
 * 
 * @interface SSMGetOptionsInterface
 * @extends {GetOptionsInterface}
 * @property {boolean} decrypt - If true, the parameter will be decrypted.
 * @property {Partial<GetParameterCommandInput>} sdkOptions - Options for the AWS SDK.
 */
interface SSMGetOptionsInterface {
  maxAge?: number
  sdkOptions?: Partial<GetParameterCommandInput>
  forceFetch?: boolean
  decrypt?: boolean
  transform?: TransformOptions
}

interface SSMGetMultipleOptionsInterface {
  maxAge?: number
  forceFetch?: boolean
  sdkOptions?: Partial<GetParametersByPathCommandInput>
  decrypt?: boolean
  recursive?: boolean
  transform?: string
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
  cached: Record<string, ExpirableValue | undefined>
  toFetch: Record<string, ExpirableValue | undefined>
} & { [key: string]: SSMGetParametersByNameOptionsInterface };

export {
  SSMGetOptionsInterface,
  SSMGetMultipleOptionsInterface,
  SSMGetParametersByNameOptionsInterface,
  SSMSplitBatchAndDecryptParametersOutputType,
  SSMGetParametersByNameOutputInterface,
  SSMGetParametersByNameFromCacheOutputType,
};