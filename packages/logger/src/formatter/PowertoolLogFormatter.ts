import { LogFormatter } from '.';
import { UnformattedAttributes } from '../../types';
import { PowertoolLog } from '../../types/formats';

class PowertoolLogFormatter extends LogFormatter {

  public formatAttributes(attributes: UnformattedAttributes): PowertoolLog {
    return {
      cold_start: attributes.lambdaContext?.coldStart,
      function_arn: attributes.lambdaContext?.invokedFunctionArn,
      function_memory_size: attributes.lambdaContext?.memoryLimitInMB,
      function_request_id: attributes.lambdaContext?.awsRequestId,
      function_name: attributes.lambdaContext?.functionName,
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
  PowertoolLogFormatter,
};