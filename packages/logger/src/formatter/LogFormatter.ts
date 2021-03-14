import { LogFormatterInterface } from '.';
import { LogAttributes, UnformattedAttributes } from '../../types';

abstract class LogFormatter implements LogFormatterInterface {

  abstract format(attributes: UnformattedAttributes): LogAttributes;

  public formatTimestamp(now: Date): string {
    return now.toISOString();
  }
}

export {
  LogFormatter
};