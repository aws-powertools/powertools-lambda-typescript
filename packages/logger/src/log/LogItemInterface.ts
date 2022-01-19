import { LogAttributes } from '../types';

interface LogItemInterface {

  addAttributes(attributes: LogAttributes): void

  getAttributes(): LogAttributes

}

export {
  LogItemInterface,
};