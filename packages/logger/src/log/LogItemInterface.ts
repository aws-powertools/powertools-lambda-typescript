import { LogAttributes } from '../types/Log';

interface LogItemInterface {

  addAttributes(attributes: LogAttributes): void;

  getAttributes(): LogAttributes;

}

export {
  LogItemInterface,
};