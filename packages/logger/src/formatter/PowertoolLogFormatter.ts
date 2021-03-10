import { LogFormatter } from '.';
import { UnformattedAttributes } from '../../types';
import { PowertoolLog } from '../../types/formats';

class PowertoolLogFormatter extends LogFormatter {

  public format(attributes: UnformattedAttributes): PowertoolLog {
    return {
      aws_request_id: attributes.awsRequestId,
      cold_start: attributes.coldStart,
      lambda_function_arn: attributes.invokedFunctionArn,
      lambda_function_memory_size: Number(attributes.memoryLimitInMB),
      lambda_function_name: attributes.functionName,
      level: attributes.logLevel,
      message: attributes.message,
      sampling_rate: attributes.sampleRateValue,
      service: attributes.serviceName,
      timestamp: this.formatTimestamp(attributes.timestamp),
      xray_trace_id: attributes.xRayTraceId,
    };
  }
  
}

export {
  PowertoolLogFormatter
};