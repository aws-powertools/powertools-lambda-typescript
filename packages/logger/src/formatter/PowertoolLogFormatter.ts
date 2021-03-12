import { LogFormatter } from '.';
import { PowertoolLog } from '../../types/formats';
import { UnformattedAttributes } from '../../types';

class PowertoolLogFormatter extends LogFormatter {

  public format(attributes: UnformattedAttributes): PowertoolLog {
    return {
      aws_request_id: attributes.lambdaContext?.awsRequestId,
      cold_start: attributes.lambdaContext?.coldStart,
      lambda_function_arn: attributes.lambdaContext?.arn,
      lambda_function_memory_size: attributes.lambdaContext?.memoryLimitInMB,
      lambda_function_name: attributes.lambdaContext?.name,
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