import { LogAttributes, UnformattedAttributes } from '../types';

/**
 * @interface
 */
interface LogFormatterInterface {

  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes
   * @returns {PowertoolLog}
   */
  formatAttributes(attributes: UnformattedAttributes): LogAttributes

  /**
   * It formats a given Error parameter.
   *
   * @param {Error} error
   * @returns {LogAttributes}
   */
  formatError(error: Error): LogAttributes

}

export {
  LogFormatterInterface,
};