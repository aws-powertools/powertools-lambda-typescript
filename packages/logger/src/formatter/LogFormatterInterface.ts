import { LogAttributes, UnformattedAttributes } from '../types';

interface LogFormatterInterface {

  formatAttributes(attributes: UnformattedAttributes): LogAttributes;

  formatError(error: Error): LogAttributes;

}

export {
  LogFormatterInterface,
};