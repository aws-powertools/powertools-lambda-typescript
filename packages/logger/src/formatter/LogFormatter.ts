import { LogFormatterInterface } from '.';
import { LogAttributes, UnformattedAttributes } from '../../types';

abstract class LogFormatter implements LogFormatterInterface {

  abstract formatAttributes(attributes: UnformattedAttributes): LogAttributes;

  public formatError(error: Error): LogAttributes {
    return {
      name: error.name,
      location: this.getCodeLocation(error.stack),
      message: error.message,
      stack: error.stack,
      
    };
  }

  public formatTimestamp(now: Date): string {
    return now.toISOString();
  }

  public getCodeLocation(stack?: string): string {
    if (!stack) {
      return '';
    }

    const regex = /\((.*):(\d+):(\d+)\)$/;
    const match = regex.exec(stack.split('\n')[1]);

    if (!Array.isArray(match)) {
      return '';
    }

    return `${match[1]}:${Number(match[2])}`;
  }
}

export {
  LogFormatter
};