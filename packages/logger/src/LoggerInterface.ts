import { LogItemExtraInput, LogItemMessage } from '../types';

interface LoggerInterface {

  debug(input: LogItemMessage, ...extraInput: LogItemExtraInput): void

  error(input: LogItemMessage, ...extraInput: LogItemExtraInput): void

  info(input: LogItemMessage, ...extraInput: LogItemExtraInput): void

  warn(input: LogItemMessage, ...extraInput: LogItemExtraInput): void

}

export {
  LoggerInterface
};