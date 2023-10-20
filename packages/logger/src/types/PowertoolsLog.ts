import type { LogAttributes, LogLevel } from './Log.js';

type PowertoolsLog = LogAttributes & {
  /**
   * Timestamp of actual log statement.
   *
   * @example "2020-05-24 18:17:33,774"
   */
  timestamp?: string;

  /**
   * Log level
   *
   * @example "INFO"
   */
  level?: LogLevel;

  /**
   * Service name defined.
   *
   * @example "payment"
   */
  service: string;

  /**
   * The value of the logging sampling rate in percentage.
   *
   * @example 0.1
   */
  sampling_rate?: number;

  /**
   * Log statement value. Unserializable JSON values will be cast to string.
   *
   * @example "Collecting payment"
   */
  message?: string;

  /**
   * X-Ray Trace ID set by the Lambda runtime.
   *
   * @example "1-5759e988-bd862e3fe1be46a994272793"
   */
  xray_trace_id?: string;

  /**
   * Indicates whether the current execution experienced a cold start.
   *
   * @example false
   */
  cold_start?: boolean;

  /**
   * The name of the Lambda function.
   *
   * @example "example-powertools-HelloWorldFunction-1P1Z6B39FLU73"
   */
  lambda_function_name?: string;

  /**
   * The memory size of the Lambda function.
   *
   * Description:
   * Example: 128
   */
  lambda_function_memory_size?: number;

  /**
   * lambda_function_arn
   *
   * Description: The ARN of the Lambda function.
   * Example: "arn:aws:lambda:eu-west-1:012345678910:function:example-powertools-HelloWorldFunction-1P1Z6B39FLU73"
   */
  lambda_function_arn?: string;

  /**
   * lambda_request_id
   *
   * Description: The request ID of the current invocation.
   * Example: "899856cb-83d1-40d7-8611-9e78f15f32f4"
   */
  lambda_request_id?: string;
};

export type { PowertoolsLog };
