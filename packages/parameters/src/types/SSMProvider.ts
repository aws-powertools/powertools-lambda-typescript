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

const isSSMGetOptionsInterface = (options: unknown): options is SSMGetOptionsInterface => (options as SSMGetOptionsInterface).decrypt !== undefined;

interface SSMGetMultipleOptionsInterface {
  maxAge?: number
  forceFetch?: boolean
  sdkOptions?: Partial<GetParametersByPathCommandInput>
  decrypt?: boolean
  recursive?: boolean
  transform?: string
  throwOnTransformError?: boolean
}

const isSSMGetMultipleOptionsInterface = 
  (options: unknown): options is SSMGetMultipleOptionsInterface => 
    (options as SSMGetMultipleOptionsInterface).decrypt !== undefined || 
    (options as SSMGetMultipleOptionsInterface).recursive !== undefined;

export {
  SSMGetOptionsInterface,
  isSSMGetOptionsInterface,
  SSMGetMultipleOptionsInterface,
  isSSMGetMultipleOptionsInterface,
};