import { Context } from 'aws-lambda';
import { ExtraAttributes, LogAttributes } from '../../types';

interface LogFormatterInterface {

  formatContext(context: Context, isColdStart: boolean): LogAttributes

  formatDefault(attributes: LogAttributes): LogAttributes

  formatExtraAttributes(attributes: ExtraAttributes): LogAttributes

}

export {
  LogFormatterInterface
};