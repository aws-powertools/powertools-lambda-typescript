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

    const stackLines = stack.split('\n');
    const regex = /\((.*):(\d+):(\d+)\)\\?$/;

    let i;
    for (i = 0; i < stackLines.length; i++) {
      const match = regex.exec(stackLines[i]);

      if (Array.isArray(match)) {
        return `${match[1]}:${Number(match[2])}`;
      }

    }

    return '';
  }
}

export {
  LogFormatter
};