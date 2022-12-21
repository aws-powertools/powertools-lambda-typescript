import type { GetParameterCommandInput, GetParametersByPathCommandInput } from '@aws-sdk/client-ssm';
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

export {
  SSMGetOptionsInterface,
  SSMGetMultipleOptionsInterface,
};