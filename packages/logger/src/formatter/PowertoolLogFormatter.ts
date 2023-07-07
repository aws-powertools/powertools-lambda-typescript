import { LogFormatter } from '.';
import { UnformattedAttributes } from '../types';
import { PowertoolLog } from '../types/formats';

/**
 * This class is used to transform a set of log key-value pairs
 * in the AWS Lambda Powertools' default structure log format. It orders
 * attribute keys in a way that should be useful when visually scanning logs in
 * a UI such as the Cloudwatch console.
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
      level: attributes.logLevel,
      message: attributes.message,
      function_request_id: attributes.lambdaContext?.awsRequestId,
      xray_trace_id: attributes.xRayTraceId,
      cold_start: attributes.lambdaContext?.coldStart,
      function_memory_size: attributes.lambdaContext?.memoryLimitInMB,
      service: attributes.serviceName,
      sampling_rate: attributes.sampleRateValue,
      function_arn: attributes.lambdaContext?.invokedFunctionArn,
      function_name: attributes.lambdaContext?.functionName,
      timestamp: this.formatTimestamp(attributes.timestamp),
    };
  }
}

export { PowertoolLogFormatter };
