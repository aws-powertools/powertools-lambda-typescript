import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type {
  GetParameterCommandInput,
  GetParametersByPathCommandInput,
  PutParameterCommandInput,
  SSMClient,
  SSMClientConfig,
} from '@aws-sdk/client-ssm';
import type {
  GetMultipleOptionsInterface,
  GetOptionsInterface,
  TransformOptions,
} from './BaseProvider.js';

/**
 * Interface for SSMProvider with clientConfig property.
 *
 * @interface
 * @property {SSMClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region.
 * @property {never} [awsSdkV3Client] - This property should never be passed.
 */
interface SSMProviderOptionsWithClientConfig {
  /**
   * Optional configuration to pass during client initialization, e.g. AWS region. It accepts the same configuration object as the AWS SDK v3 client (`SSMClient`).
   */
  clientConfig?: SSMClientConfig;
  awsSdkV3Client?: never;
}

/**
 * Interface for SSMProvider with awsSdkV3Client property.
 *
 * @interface
 * @property {SSMClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during SSMProvider class instantiation
 * @property {never} [clientConfig] - This property should never be passed.
 */
interface SSMProviderOptionsWithClientInstance {
  /**
   * Optional AWS SDK v3 client instance (`SSMClient`) to use for SSM operations. If not provided, we will create a new instance of `SSMClient`.
   */
  awsSdkV3Client?: SSMClient;
  clientConfig?: never;
}

/**
 * Options for the SSMProvider class constructor.
 *
 * @type SSMProviderOptions
 * @property {SSMClientConfig} [clientConfig] - Optional configuration to pass during client initialization, e.g. AWS region. Mutually exclusive with awsSdkV3Client.
 * @property {SSMClient} [awsSdkV3Client] - Optional AWS SDK v3 client to pass during DynamoDBProvider class instantiation. Mutually exclusive with clientConfig.
 */
type SSMProviderOptions =
  | SSMProviderOptionsWithClientConfig
  | SSMProviderOptionsWithClientInstance;

/**
 * Options for the SSMProvider getMultiple method.
 *
 * @interface SSMGetOptionsBase
 * @extends {GetOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {GetItemCommandInput} [sdkOptions] - Additional options to pass to the AWS SDK v3 client. Supports all options from `GetParameterCommandInput`.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 * @property {boolean} decrypt - If true, the parameter will be decrypted. Defaults to `false`.
 */
interface SSMGetOptionsBase extends GetOptionsInterface {
  /**
   * If true, the parameter will be decrypted. Defaults to `false`.
   */
  decrypt?: boolean;
  /**
   * Additional options to pass to the AWS SDK v3 client. Supports all options from `GetParameterCommandInput`.
   */
  sdkOptions?: Partial<GetParameterCommandInput>;

  transform?: Exclude<TransformOptions, 'auto'>;
}

interface SSMGetOptionsTransformJson extends SSMGetOptionsBase {
  transform: 'json';
}

interface SSMGetOptionsTransformBinary extends SSMGetOptionsBase {
  transform: 'binary';
}

interface SSMGetOptionsTransformNone extends SSMGetOptionsBase {
  transform?: never;
}

type SSMGetOptions =
  | SSMGetOptionsTransformJson
  | SSMGetOptionsTransformBinary
  | SSMGetOptionsTransformNone
  | undefined;

type ParameterType = 'String' | 'StringList' | 'SecureString';

type ParameterTier = 'Standard' | 'Advanced' | 'Intelligent-Tiering';

type SSMSetOptions = {
  /**
   * The parameter value
   */
  value: string;
  /**
   * If the parameter value should be overwritten
   * @default false
   */
  overwrite?: boolean;
  /**
   * The description of the parameter
   */
  description?: string;
  /**
   * Type of the parameter, can be one of `String`, `StringList`, or `SecureString`
   * @default `String`
   */
  parameterType?: ParameterType;
  /**
   * The parameter tier to use, can be one of `Standard`, `Advanced`, and `Intelligent-Tiering`
   * @default `Standard`
   */
  tier?: ParameterTier;
  /**
   * The KMS key id to use to encrypt the parameter
   */
  kmsKeyId?: string;
  /**
   * Additional options to pass to the AWS SDK v3 client
   */
  sdkOptions?: Partial<PutParameterCommandInput>;
};

/**
 * Generic output type for the SSMProvider get method.
 */
type SSMGetOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined,
> = undefined extends ExplicitUserProvidedType
  ? undefined extends InferredFromOptionsType
    ? string
    : InferredFromOptionsType extends
          | SSMGetOptionsTransformNone
          | SSMGetOptionsTransformBinary
      ? string
      : InferredFromOptionsType extends SSMGetOptionsTransformJson
        ? JSONValue
        : never
  : ExplicitUserProvidedType;

/**
 * Options for the SSMProvider getMultiple method.
 *
 * @interface SSMGetMultipleOptionsBase
 * @extends {GetMultipleOptionsInterface}
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {boolean} forceFetch - Force fetch the value from the parameter store, ignoring the cache.
 * @property {GetItemCommandInput} [sdkOptions] - Additional options to pass to the AWS SDK v3 client.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 * @property {boolean} decrypt - If true, the parameter will be decrypted.
 * @property {boolean} recursive - If true, the parameter will be fetched recursively.
 * @property {boolean} throwOnTransformError - If true, the method will throw an error if the transform fails.
 */
interface SSMGetMultipleOptionsBase extends GetMultipleOptionsInterface {
  /**
   * Additional options to pass to the AWS SDK v3 client. Supports all options from `GetParametersByPathCommandInput`.
   */
  sdkOptions?: Partial<GetParametersByPathCommandInput>;
  /**
   * If true, the parameters will be decrypted. Defaults to `false`.
   */
  decrypt?: boolean;
  /**
   * If true, the parameters will be fetched recursively. Defaults to `false`.
   */
  recursive?: boolean;
  /**
   * If true, the method will throw an error if the transform fails.
   */
  throwOnTransformError?: boolean;
}

interface SSMGetMultipleOptionsTransformJson extends SSMGetMultipleOptionsBase {
  transform: 'json';
}

interface SSMGetMultipleOptionsTransformBinary
  extends SSMGetMultipleOptionsBase {
  transform: 'binary';
}

interface SSMGetMultipleOptionsTransformAuto extends SSMGetMultipleOptionsBase {
  transform: 'auto';
}

interface SSMGetMultipleOptionsTransformNone extends SSMGetMultipleOptionsBase {
  transform?: never;
}

type SSMGetMultipleOptions =
  | SSMGetMultipleOptionsTransformJson
  | SSMGetMultipleOptionsTransformBinary
  | SSMGetMultipleOptionsTransformAuto
  | SSMGetMultipleOptionsTransformNone
  | undefined;

/**
 * Generic output type for the SSMProvider getMultiple method.
 */
type SSMGetMultipleOutput<
  ExplicitUserProvidedType = undefined,
  InferredFromOptionsType = undefined,
> = undefined extends ExplicitUserProvidedType
  ? undefined extends InferredFromOptionsType
    ? Record<string, string>
    : InferredFromOptionsType extends
          | SSMGetMultipleOptionsTransformNone
          | SSMGetMultipleOptionsTransformBinary
      ? Record<string, string>
      : InferredFromOptionsType extends SSMGetMultipleOptionsTransformAuto
        ? Record<string, JSONValue>
        : InferredFromOptionsType extends SSMGetMultipleOptionsTransformJson
          ? Record<string, JSONValue>
          : never
  : Record<string, ExplicitUserProvidedType>;

/**
 * Options for the SSMProvider getParametersByName method.
 *
 * @interface SSMGetParametersByNameOptions
 * @property {number} maxAge - Maximum age of the value in the cache, in seconds.
 * @property {TransformOptions} transform - Transform to be applied, can be 'json' or 'binary'.
 * @property {boolean} decrypt - If true, the parameter will be decrypted.
 * @property {boolean} throwOnError - If true, the method will throw an error if one of the parameters cannot be fetched. Otherwise it will aggregate the errors under an _errors key in the response.
 */
interface SSMGetParametersByNameOptions {
  maxAge?: number;
  throwOnError?: boolean;
  decrypt?: boolean;
  transform?: Exclude<TransformOptions, 'auto'>;
}

/**
 * Output type for the SSMProvider splitBatchAndDecryptParameters method.
 */
type SSMSplitBatchAndDecryptParametersOutputType = {
  parametersToFetchInBatch: Record<string, SSMGetParametersByNameOptions>;
  parametersToDecrypt: Record<string, SSMGetParametersByNameOptions>;
};

/**
 * Output type for the SSMProvider getParametersByName method.
 */
interface SSMGetParametersByNameOutputInterface {
  response: Record<string, unknown>;
  errors: string[];
}

/**
 * Output type for the SSMProvider getParametersByNameFromCache method.
 */
type SSMGetParametersByNameFromCacheOutputType = {
  cached: Record<string, string | Record<string, unknown>>;
  toFetch: Record<string, SSMGetParametersByNameOptions>;
};

/**
 * Generic output type for the SSMProvider getParametersByName method.
 */
type SSMGetParametersByNameOutput<InferredFromOptionsType = undefined> =
  undefined extends InferredFromOptionsType
    ? Record<string, unknown> & { _errors?: string[] }
    : Record<string, InferredFromOptionsType> & { _errors?: string[] };

export type {
  SSMProviderOptions,
  SSMGetOptions,
  SSMSetOptions,
  SSMGetOutput,
  SSMGetMultipleOptions,
  SSMGetMultipleOutput,
  SSMGetParametersByNameOptions,
  SSMSplitBatchAndDecryptParametersOutputType,
  SSMGetParametersByNameOutputInterface,
  SSMGetParametersByNameFromCacheOutputType,
  SSMGetParametersByNameOutput,
};
