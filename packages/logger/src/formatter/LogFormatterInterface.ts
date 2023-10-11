import { LogAttributes } from '../types/Log.js';
import { UnformattedAttributes } from '../types/Logger.js';
import { LogItem } from '../log/LogItem.js';

/**
 * @interface
 */
interface LogFormatterInterface {
  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes
   * @param {LogAttributes} additionalLogAttributes
   * @returns {LogItem}
   */
  formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem;

  /**
   * It formats a given Error parameter.
   *
   * @param {Error} error
   * @returns {LogAttributes}
   */
  formatError(error: Error): LogAttributes;
}

export { LogFormatterInterface };
