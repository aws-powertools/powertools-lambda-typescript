import type { Context } from 'aws-lambda';
import type { LogLevel } from './Logger.js';

/**
 * Type that extends an autocompletable string by allowing any string value.
 *
 * For example, if we have a type `type MyString = 'foo' | 'bar';`, when using
 * `MyString` in a function, the autocomplete will only show `foo` and `bar`.
 *
 * For many cases, this is fine, but sometimes we also want to allow any _other_
 * string value, so we can use `AutocompletableString` instead and extend it like
 * this: `type MyString = 'foo' | 'bar' | AutocompletableString;`.
 */
type AutocompletableString = string & {};

/**
 * Generic log attribute object used as a base.
 */
type LogAttributes = { [key: string]: unknown };

/**
 * Log attribute object with a message key.
 *
 * This is the most common log attribute object and it's used as first argument in the logger methods.
 */
type LogAttributesWithMessage = LogAttributes & {
  message: string;
};

/**
 * The environment in which the Lambda function is running.
 */
type Environment = 'dev' | 'local' | 'staging' | 'prod' | AutocompletableString;

/**
 * Standard keys that are included in every log item when using the default log formatter.
 *
 * See {@link https://docs.powertools.aws.dev/lambda/python/latest/core/logger/#standard-structured-keys | Standard structured keys} for more information.
 */
type PowertoolsStandardKeys = {
  /**
   * Log level of the log item
   *
   * @example "INFO"
   */
  level: LogLevel;
  /**
   * A descriptive, human-readable representation of the log item
   *
   * @example "Query performed to DynamoDB"
   */
  message: string;
  /**
   * The percentage rate at which the log level is switched to `DEBUG`.
   *
   * See {@link https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/#sampling-debug-logs | Sampling debug logs} for more information.
   *
   * @example 0.1
   */
  sampling_rate: number;
  /**
   * A unique name identifier of the service this AWS Lambda function belongs to.
   *
   * @default "service_undefined"
   *
   * @example "serverlessAirline"
   */
  service: string;
  /**
   * Timestamp string in simplified extended ISO format (ISO 8601)
   *
   * @example "2011-10-05T14:48:00.000Z"
   */
  timestamp: string;
  /**
   * X-Ray Trace ID set by the Lambda runtime.
   *
   * @example "1-5759e988-bd862e3fe1be46a994272793"
   */
  xray_trace_id: string;
  /**
   * An optional object containing information about the error passed to the logger
   */
  error?: Error;
};

/**
 * Additional keys that are added to the log item when using the default log formatter and
 * having added AWS Lambda context.
 *
 * See {@link https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/#capturing-lambda-context-info | Capturing Lambda context info} for more information.
 */
type PowertoolsLambdaContextKeys = {
  /**
   * Indicates whether the current execution experienced a cold start.
   *
   * @example false
   */
  cold_start: boolean;
  /**
   * The name of the Lambda function.
   *
   * @example "example-powertools-HelloWorldFunction-1P1Z6B39FLU73"
   */
  function_name: string;
  /**
   * The memory size of the Lambda function.
   *
   * @example "128"
   */
  function_memory_size: string;
  /**
   * The ARN of the Lambda function.
   *
   * @example "arn:aws:lambda:eu-west-1:012345678910:function:example-powertools-HelloWorldFunction-1P1Z6B39FLU73"
   */
  function_arn: string;
  /**
   * The request ID of the current invocation.
   *
   * @example "899856cb-83d1-40d7-8611-9e78f15f32f4"
   */
  function_request_id: string;
};

/**
 * Keys available to the logger when customers have captured AWS Lambda context information.
 *
 * This object is a subset of the `Context` object from the `aws-lambda` package and is used
 * only internally by the logger and passed to the log formatter.
 *
 * For the public API used in the default log formatter, see {@link PowertoolsLambdaContextKeys}.
 *
 * @internal
 */
type LambdaFunctionContext = Pick<
  Context,
  | 'functionName'
  | 'memoryLimitInMB'
  | 'functionVersion'
  | 'invokedFunctionArn'
  | 'awsRequestId'
> & {
  coldStart: boolean;
};

/**
 * Keys managed by the Powertools for AWS Lambda Logger.
 *
 * This type is used internally by the logger and passed to the log formatter.
 *
 * For the public API used in the log formatter, see {@link PowertoolsStandardKeys} and {@link PowertoolsLambdaContextKeys}.
 */
type PowertoolsLogData = {
  /**
   * The environment in which the Lambda function is running.
   */
  environment?: Environment;
  /**
   * The name of the service this AWS Lambda function belongs to.
   */
  serviceName: string;
  /**
   * The percentage rate at which the log level is switched to `DEBUG`.
   */
  sampleRateValue: number;
  /**
   * Lambda context information.
   *
   * See {@link LambdaFunctionContext} for more information.
   */
  lambdaContext?: LambdaFunctionContext;
  /**
   * The X-Ray Trace ID set by the Lambda runtime.
   */
  xRayTraceId?: string;
  /**
   * The AWS region in which the Lambda function is running.
   */
  awsRegion: string;
};

/**
 * Base log attributes that are included in every log item.
 */
type BaseLogAttributes = {
  /**
   * An optional object containing information about the error passed to the logger.
   */
  error?: Error;
  /**
   * Log level of the log item.
   */
  logLevel: LogLevel;
  /**
   * Timestamp string in simplified extended ISO format (ISO 8601).
   */
  timestamp: Date;
  /**
   * A descriptive, human-readable representation of the log item.
   */
  message: string;
};

/**
 * Unformatted attributes that are passed to the log formatter.
 */
type UnformattedAttributes = LogAttributes &
  PowertoolsLogData &
  BaseLogAttributes;

/**
 * Keys that can be used to order log attributes by.
 */
type LogKey =
  | keyof PowertoolsStandardKeys
  | keyof PowertoolsLambdaContextKeys
  | AutocompletableString;

export type {
  LogAttributes,
  LogAttributesWithMessage,
  Environment,
  PowertoolsLogData,
  PowertoolsStandardKeys,
  PowertoolsLambdaContextKeys,
  UnformattedAttributes,
  LogKey,
};
