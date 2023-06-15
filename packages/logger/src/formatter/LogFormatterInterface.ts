import { LogAttributes, UnformattedAttributes } from '../types';
import { LogItem } from '../log';

/**
 * @interface
 */
interface LogFormatterInterface {
  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes
   * @param {LogAttributes} persistentLogAttributes
   * @param {LogAttributes} additionalLogAttributes
   * @returns {LogItem}
   */
  formatAttributes(
    attributes: UnformattedAttributes,
    persistentLogAttributes: LogAttributes,
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
