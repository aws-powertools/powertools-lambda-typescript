import { Context } from 'aws-lambda';
import { LogFormatterInterface } from '.';
import { ExtraAttributes, LogAttributes, LoggerAttributes } from '../../types';

abstract class LogFormatter implements LogFormatterInterface {

  abstract formatContext(context: Context, isColdStart: boolean): LogAttributes;

  abstract formatDefault(baseAttributes: LoggerAttributes): LogAttributes;

  abstract formatExtraAttributes(attributes: ExtraAttributes): LogAttributes;

  public formatTimestamp(now: Date): string {
    return now.toISOString();
  }
}

export {
  LogFormatter
};