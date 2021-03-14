import { LoggerExtraInput, LoggerInput } from '../types';

interface LoggerInterface {

  debug(input: LoggerInput, ...extraInput: LoggerExtraInput): void

  error(input: LoggerInput, ...extraInput: LoggerExtraInput): void

  info(input: LoggerInput, ...extraInput: LoggerExtraInput): void

  warn(input: LoggerInput, ...extraInput: LoggerExtraInput): void

}

export {
  LoggerInterface
};