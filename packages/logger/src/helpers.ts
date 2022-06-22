import { Logger } from '.';
import { ConstructorOptions } from './types';

const createLogger = (options: ConstructorOptions = {}): Logger => new Logger(options);

export {
  createLogger,
};