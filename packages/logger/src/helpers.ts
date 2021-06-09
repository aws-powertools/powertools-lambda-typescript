import { Logger } from '.';
import { LoggerOptions } from '../types';

const createLogger = (options: LoggerOptions = {}): Logger => new Logger(options);

export {
  createLogger
};