import { DefaultLoggerAttributes, LogAttributes } from '../../types';

interface LogFormatterInterface {

  format(attributes: DefaultLoggerAttributes): LogAttributes

}

export {
  LogFormatterInterface
};