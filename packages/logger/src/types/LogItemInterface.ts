import { LogAttributes } from './Log.js';

interface LogItemInterface {
  addAttributes(attributes: LogAttributes): void;

  getAttributes(): LogAttributes;
}

export { LogItemInterface };
