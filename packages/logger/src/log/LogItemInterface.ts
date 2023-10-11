import { LogAttributes } from '../types/Log.js';

interface LogItemInterface {
  addAttributes(attributes: LogAttributes): void;

  getAttributes(): LogAttributes;
}

export { LogItemInterface };
