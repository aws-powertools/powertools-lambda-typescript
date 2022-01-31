import { LogFormatter } from '.';
import { UnformattedAttributes } from '../types';
import { PowertoolLog } from '../types/formats';

/**
 * This class is used to transform a set of log key-value pairs
 * in the AWS Lambda Powertools' default structure log format.
 *
 * @class
 * @extends {LogFormatter}
 */
class PowertoolLogFormatter extends LogFormatter {

  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes
   * @returns {PowertoolLog}
   */
  public formatAttributes(attributes: UnformattedAttributes): PowertoolLog {
    return {
      cold_start: attributes.lambdaContext?.coldStart,
      function_arn: attributes.lambdaContext?.invokedFunctionArn,
      function_memory_size: attributes.lambdaContext?.memoryLimitInMB,
      function_name: attributes.lambdaContext?.functionName,
      function_request_id: attributes.lambdaContext?.awsRequestId,
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