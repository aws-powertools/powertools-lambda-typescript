import { LogAttributes } from '../../types';
import { LogItemInterface } from '.';

class LogItem implements LogItemInterface {

  private attributes: LogAttributes = {};

  public constructor(attributes: LogAttributes) {
    this.attributes = attributes;
    
    return this;
  }

  public addAttributes(attributes: LogAttributes): LogItem {
    this.attributes = {
      ...this.attributes,
      ...attributes
    };

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