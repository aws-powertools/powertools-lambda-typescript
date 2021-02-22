import { CustomAttributes } from '../types/Log';

interface LoggerInterface {

  debug(message: string, attributes?: CustomAttributes): void

  info(message: string, attributes?: CustomAttributes): void

  warn(message: string, attributes?: CustomAttributes): void

  error(message: string, attributes?: CustomAttributes): void

}

export {
  LoggerInterface
};