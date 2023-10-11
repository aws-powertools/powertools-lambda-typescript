import { LogAttributes } from '../types/index.js';

interface LogItemInterface {
  addAttributes(attributes: LogAttributes): void;

  getAttributes(): LogAttributes;
}

export { LogItemInterface };
