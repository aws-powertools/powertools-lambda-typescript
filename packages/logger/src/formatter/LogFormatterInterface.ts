import { LogAttributes, UnformattedAttributes } from '../../types';

interface LogFormatterInterface {

  format(attributes: UnformattedAttributes): LogAttributes

}

export {
  LogFormatterInterface
};