import { Context } from 'aws-lambda';

import { LogFormatter } from '.';
import { ExtraAttributes, LoggerAttributes } from '../../types';
import { PowertoolContextInfo, PowertoolExtraInfo, PowertoolLog } from '../../types/formats';

class PowertoolLogFormatter extends LogFormatter {

  public formatContext(context: Context, isColdStart: boolean): PowertoolContextInfo {
    return {
      aws_request_id: context.awsRequestId,
      cold_start: isColdStart,
      lambda_function_arn: context.invokedFunctionArn,
      lambda_function_memory_size: Number(context.memoryLimitInMB),
      lambda_function_name: context.functionName
    };
  }

  public formatDefault(baseAttributes: LoggerAttributes): PowertoolLog {
    return {
      sampling_rate: baseAttributes.sampleRateValue,
      service: baseAttributes.serviceName,
      xray_trace_id: baseAttributes.xRayTraceId
    };
  }

  public formatExtraAttributes(attributes: ExtraAttributes): PowertoolExtraInfo {
    return {
      message: attributes.message,
      timestamp: this.formatTimestamp(attributes.timestamp),
      level: attributes.logLevel
    };
  }
  
}

export {
  PowertoolLogFormatter
};