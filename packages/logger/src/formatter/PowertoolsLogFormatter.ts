import { LogFormatter } from '.';
import { LogAttributes, UnformattedAttributes } from '../types';
import { PowertoolsLog } from '../types/formats';
import { LogItem } from '../log';

/**
 * This class is used to transform a set of log key-value pairs
 * in the AWS Lambda Powertools' default structure log format.
 *
 * @class
 * @extends {LogFormatter}
 */
class PowertoolsLogFormatter extends LogFormatter {
  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes
   * @param {LogAttributes} additionalLogAttributes
   * @returns {PowertoolsLog}
   */
  public formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem {
    const baseAttributes: PowertoolsLog = {
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

    powertoolLogItem.addAttributes(additionalLogAttributes);

    return powertoolLogItem;
  }
}

export { PowertoolsLogFormatter };
