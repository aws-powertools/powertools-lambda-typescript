import { LogAttributes } from '../../types';
import { LogItemInterface } from '.';
import { merge } from 'lodash/fp';

class LogItem implements LogItemInterface {

  private attributes: LogAttributes = {};

  public addAttributes(attributes: LogAttributes): LogItem {
    this.attributes = merge(this.attributes, attributes);

    return this;
  }

  public getAttributes(): LogAttributes {
    return this.attributes;
  }

  public toJSON(): string {
    return JSON.stringify(this.getAttributes());
  }

}

export {
  LogItem
};