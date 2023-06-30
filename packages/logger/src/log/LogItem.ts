import merge from 'lodash.merge';
import { LogItemInterface } from '.';
import { LogAttributes } from '../types';

class LogItem implements LogItemInterface {
  private attributes: LogAttributes = {};

  public constructor(params: { attributes: LogAttributes }) {
    // Add attributes in the log item in this order:
    // - Base attributes supported by the Powertool by default
    // - Persistent attributes provided by developer, not formatted (done later)
    // - Ephemeral attributes provided as parameters for a single log item (done later)
    this.addAttributes(params.attributes);
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
    const newAttributes: LogAttributes = {};
    for (const key in attributes) {
      if (
        attributes[key] !== undefined &&
        attributes[key] !== '' &&
        attributes[key] !== null
      ) {
        newAttributes[key] = attributes[key];
      }
    }

    return newAttributes;
  }

  public setAttributes(attributes: LogAttributes): void {
    this.attributes = attributes;
  }
}

export { LogItem };
