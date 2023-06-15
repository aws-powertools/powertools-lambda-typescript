import { LogFormatter } from '.';
import { LogAttributes, UnformattedAttributes } from '../types';
import { PowertoolLog } from '../types/formats';
import { LogItem } from '../log';

/**
 * This class is used to transform a set of log key-value pairs
 * in the AWS Lambda Powertools' default structure log format.
 *
 * @class
 * @extends {LogFormatter}
 */
class PowertoolLogFormatter extends LogFormatter {
  public formatAttributes(
    attributes: UnformattedAttributes,
    persistentLogAttributes: LogAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem {
    const baseAttributes: PowertoolLog = {
      // standard attributes from UnformattedAttributes
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

    const powertoolLogItem = new LogItem({ attributes: baseAttributes });

    powertoolLogItem.addAttributes(persistentLogAttributes);
    powertoolLogItem.addAttributes(additionalLogAttributes);

    return powertoolLogItem;
  }

  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes
   * @returns {PowertoolLog}
   
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
  }*/
}

export { PowertoolLogFormatter };
