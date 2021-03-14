import { LogAttributes } from '../../types/Log';

interface LogItemInterface {

  addAttributes(attributes: LogAttributes): void

  getAttributes(): LogAttributes

  toJSON(): string

}

export {
  LogItemInterface
};