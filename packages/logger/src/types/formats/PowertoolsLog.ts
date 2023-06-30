import type { LogAttributes, LogLevel } from '..';

type PowertoolsLog = LogAttributes & {
  /**
   * timestamp
   *
   * Description: Timestamp of actual log statement.
   * Example: "2020-05-24 18:17:33,774"
   */
  timestamp?: string;

  /**
   * level
   *
   * Description: Logging level
   * Example: "INFO"
   */
  level?: LogLevel;

  /**
   * service
   *
   * Description: Service name defined.
   * Example: "payment"
   */
  service: string;

  /**
   * sampling_rate
   *
   * Description: The value of the logging sampling rate in percentage.
   * Example: 0.1
   */
  sampling_rate?: number;

  /**
   * message
   *
   * Description: Log statement value. Unserializable JSON values will be cast to string.
   * Example: "Collecting payment"
   */
  message?: string;

  /**
   * xray_trace_id
   *
   * Description: X-Ray Trace ID when Lambda function has enabled Tracing.
   * Example: "1-5759e988-bd862e3fe1be46a994272793"
   */
  xray_trace_id?: string;

  /**
   * cold_start
   *
   * Description: Indicates whether the current execution experienced a cold start.
   * Example: false
   */
  cold_start?: boolean;

  /**
   * lambda_function_name
   *
   * Description: The name of the Lambda function.
   * Example: "example-powertools-HelloWorldFunction-1P1Z6B39FLU73"
   */
  lambda_function_name?: string;

  /**
   * lambda_function_memory_size
   *
   * Description: The memory size of the Lambda function.
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
