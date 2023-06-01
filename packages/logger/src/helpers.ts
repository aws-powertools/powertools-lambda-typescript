import { Logger } from '.';
import { ConstructorOptions } from './types';

/**
 * Create a new logger instance with the given options.
 *
 * @deprecated - This function will be removed in the next major release. Use the Logger class directly instead.
 */
const createLogger = (options: ConstructorOptions = {}): Logger =>
  new Logger(options);

export { createLogger };
