import { pickBy, merge } from 'lodash';
import { LogItemInterface } from '.';
import { LogAttributes } from '../types';

class LogItem implements LogItemInterface {

  private attributes: LogAttributes = {};

  public constructor(params: { baseAttributes: LogAttributes; persistentAttributes: LogAttributes }) {
    // Add attributes in the log item in this order:
    // - Base attributes supported by the Powertool by default
    // - Persistent attributes provided by developer, not formatted
    // - Ephemeral attributes provided as parameters for a single log item (done later)
    this.addAttributes(params.baseAttributes);
    this.addAttributes(params.persistentAttributes);
  }

  public addAttributes(attributes: LogAttributes): LogItem {
    this.attributes = merge(this.attributes, attributes);

    return this;
  }

  public getAttributes(): LogAttributes {
    return this.attributes;
  }

  public prepareForPrint(): void {
    this.setAttributes(this.removeEmptyKeys(this.getAttributes()));
  }

  public removeEmptyKeys(attributes: LogAttributes): LogAttributes {
    return pickBy(attributes, (value) => value !== undefined && value !== '' && value !== null);
  }

  public setAttributes(attributes: LogAttributes): void {
    this.attributes = attributes;
  }

}

export {
  LogItem,
};