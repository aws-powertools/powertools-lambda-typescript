import { LogAttributes } from './Log.js';
import { UnformattedAttributes } from './Logger.js';
import { LogItem } from '../formatter/LogItem.js';

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

  /**
   * It formats a date into a string in simplified extended ISO format (ISO 8601).
   *
   * @param {Date} now
   * @returns {string}
   */
  formatTimestamp(now: Date): string;

  /**
   * It returns a string containing the location of an error, given a particular stack trace.
   *
   * @param stack
   * @returns {string}
   */
  getCodeLocation(stack?: string): string;
}

export { LogFormatterInterface };
