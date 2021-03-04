import { LogAttributes } from '../types/Log';
import { LogDataInterface } from './LogDataInterface';

class LogData implements LogDataInterface {

  private attributes: LogAttributes = {};

  public constructor(attributes: LogAttributes) {
    this.attributes = attributes;
    
    return this;
  }

  public addAttributes(attributes: LogAttributes): LogData {
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
  LogData
};