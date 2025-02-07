import type {
  LogRecordOrderKeys,
  PowertoolsLogFormatterOptions,
} from '../types/formatters.js';
import type {
  LogAttributes,
  PowertoolsLambdaContextKeys,
  PowertoolsStandardKeys,
  UnformattedAttributes,
} from '../types/logKeys.js';
import { LogFormatter } from './LogFormatter.js';
import { LogItem } from './LogItem.js';

/**
 * This class is used to transform a set of log key-value pairs
 * in the Powertools for AWS Lambda default structure log format.
 *
 * @class
 * @extends {LogFormatter}
 */
class PowertoolsLogFormatter extends LogFormatter {
  /**
   * List of keys to order log attributes by.
   *
   * This can be a set of keys or an array of keys.
   */
  #logRecordOrder?: LogRecordOrderKeys;

  public constructor(options?: PowertoolsLogFormatterOptions) {
    super(options);
    this.#logRecordOrder = options?.logRecordOrder;
  }

  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes - unformatted attributes
   * @param {LogAttributes} additionalLogAttributes - additional log attributes
   */
  public formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem {
    const baseAttributes: Partial<PowertoolsStandardKeys> &
      Partial<PowertoolsLambdaContextKeys> &
      LogAttributes = {
      level: attributes.logLevel,
      message: attributes.message,
      timestamp: this.formatTimestamp(attributes.timestamp),
      service: attributes.serviceName,
      cold_start: attributes.lambdaContext?.coldStart,
      function_arn: attributes.lambdaContext?.invokedFunctionArn,
      function_memory_size: attributes.lambdaContext?.memoryLimitInMB,
      function_name: attributes.lambdaContext?.functionName,
      function_request_id: attributes.lambdaContext?.awsRequestId,
      sampling_rate: attributes.sampleRateValue,
      xray_trace_id: attributes.xRayTraceId,
    };

    // If logRecordOrder is not set, return the log item with the attributes in the order they were added
    if (this.#logRecordOrder === undefined) {
      return new LogItem({ attributes: baseAttributes }).addAttributes(
        additionalLogAttributes
      );
    }

    const orderedAttributes: LogAttributes = {};
    // If logRecordOrder is set, order the attributes in the log item
    for (const key of this.#logRecordOrder) {
      if (key in baseAttributes && !(key in orderedAttributes)) {
        orderedAttributes[key] = baseAttributes[key];
      } else if (
        key in additionalLogAttributes &&
        !(key in orderedAttributes)
      ) {
        orderedAttributes[key] = additionalLogAttributes[key];
      }
    }

    // Add remaining attributes from baseAttributes
    for (const key in baseAttributes) {
      if (!(key in orderedAttributes)) {
        orderedAttributes[key] = baseAttributes[key];
      }
    }

    // Add remaining attributes from additionalLogAttributes
    for (const key in additionalLogAttributes) {
      if (!(key in orderedAttributes)) {
        orderedAttributes[key] = additionalLogAttributes[key];
      }
    }

    const powertoolsLogItem = new LogItem({
      attributes: orderedAttributes,
    });

    return powertoolsLogItem;
  }
}

export { PowertoolsLogFormatter };
