import { LogFormatterInterface } from '.';
import { DefaultLoggerAttributes, LogAttributes } from '../../types';

abstract class LogFormatter implements LogFormatterInterface {

  abstract format(attributes: DefaultLoggerAttributes): LogAttributes;

  public formatTimestamp(now: Date): string {
    return now.toISOString();
  }
}

export {
  LogFormatter
};