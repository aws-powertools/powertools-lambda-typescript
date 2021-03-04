import { LogSchemaInterface } from './LogSchemaInterface';

class PowertoolLogSchema implements LogSchemaInterface {

  /**
   * timestamp
   *
   * Description: Timestamp of actual log statement.
   * Example: "2020-05-24 18:17:33,774"
   */
  protected timestamp: string = 'timestamp';

  /**
   * level
   *
   * Description: Logging level
   * Example: "INFO"
   */
  protected logLevel: string = 'level';

  /**
   * location
   *
   * Description: Source code location where statement was executed.
   * Example: "collect.handler:1"
   */
  protected sourceCodeLocation: string = 'location';

  /**
   * service
   *
   * Description: Service name defined.
   * Example: "payment"
   */
  protected serviceName: string = 'service';

  /**
   * sampling_rate
   *
   * Description: The value of the logging sampling rate in percentage.
   * Example: 0.1
   */
  protected sampleRateValue: string = 'sampling_rate';

  /**
   * message
   *
   * Description: Log statement value. Unserializable JSON values will be casted to string.
   * Example: "Collecting payment"
   */
  protected message: string = 'message';

  /**
   * xray_trace_id
   *
   * Description: X-Ray Trace ID when Lambda function has enabled Tracing.
   * Example: "1-5759e988-bd862e3fe1be46a994272793"
   */
  protected xrayTraceId: string = 'xray_trace_id';

  /**
   * cold_start
   *
   * Description: Indicates whether the current execution experienced a cold start.
   * Example: false
   */
  protected coldStart: string = 'cold_start';

  /**
   * lambda_function_name
   *
   * Description: The name of the Lambda function.
   * Example: "example-powertools-HelloWorldFunction-1P1Z6B39FLU73"
   */
  protected functionName: string = 'lambda_function_name';

  /**
   * lambda_function_memory_size
   *
   * Description: The memory size of the Lambda function.
   * Example: 128
   */
  protected functionMemorySize: string = 'lambda_function_memory_size';

  /**
   * lambda_function_arn
   *
   * Description: The ARN of the Lambda function.
   * Example: "arn:aws:lambda:eu-west-1:012345678910:function:example-powertools-HelloWorldFunction-1P1Z6B39FLU73"
   */
  protected functionArn: string = 'lambda_function_arn';

  /**
   * lambda_request_id
   *
   * Description: The request ID of the current invocation.
   * Example: "899856cb-83d1-40d7-8611-9e78f15f32f4"
   */
  protected functionRequestId: string = 'lambda_request_id';

  public getTimestampKey(): string {
    return this.timestamp;
  }

  public getLogLevelKey(): string {
    return this.logLevel;
  }

  public getSourceCodeLocationKey(): string {
    return this.sourceCodeLocation;
  }

  public getServiceNameKey(): string {
    return this.serviceName;
  }

  public getSampleRateValueKey(): string {
    return this.sampleRateValue;
  }

  public getMessageKey(): string {
    return this.message;
  }

  public getXrayTraceIdKey(): string {
    return this.xrayTraceId;
  }

  public getColdStartKey(): string {
    return this.coldStart;
  }

  public getFunctionNameKey(): string {
    return this.functionName;
  }

  public getFunctionMemorySizeKey(): string {
    return this.functionMemorySize;
  }

  public getFunctionArnKey(): string {
    return this.functionArn;
  }

  public getFunctionRequestIdKey(): string {
    return this.functionRequestId;
  }
  
}

export {
  PowertoolLogSchema
};