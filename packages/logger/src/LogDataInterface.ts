import { LogAttributes } from '../types/Log';

interface LogDataInterface {

  addAttributes(attributes: LogAttributes): void

  getAttributes(): LogAttributes

  toJSON(): string

}

export {
  LogDataInterface
};