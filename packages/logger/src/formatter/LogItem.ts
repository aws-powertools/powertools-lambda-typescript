import merge from 'lodash.merge';
import type { LogAttributes, LogItemInterface } from '../types/Log.js';

/**
 * LogItem is a class that holds the attributes of a log item.
 * It is used to store the attributes of a log item and to add additional attributes to it.
 * It is used by the LogFormatter to store the attributes of a log item.
 *
 * @class
 */
class LogItem implements LogItemInterface {
  /**
   * The attributes of the log item.
   */
  private attributes: LogAttributes = {};

  /**
   * Constructor for LogItem.
   * @param {Object} params - The parameters for the LogItem.
   * @param {LogAttributes} params.attributes - The initial attributes for the LogItem.
   */
  public constructor(params: { attributes: LogAttributes }) {
    // Add attributes in the log item in this order:
    // - Base attributes supported by the Powertool by default
    // - Persistent attributes provided by developer, not formatted (done later)
    // - Ephemeral attributes provided as parameters for a single log item (done later)
    this.addAttributes(params.attributes);
  }

  /**
   * Add attributes to the log item.
   * @param {LogAttributes} attributes - The attributes to add to the log item.
   */
  public addAttributes(attributes: LogAttributes): this {
    merge(this.attributes, attributes);

    return this;
  }

  /**
   * Get the attributes of the log item.
   */
  public getAttributes(): LogAttributes {
    return this.attributes;
  }

  /**
   * Prepare the log item for printing.
   */
  public prepareForPrint(): void {
    this.setAttributes(this.removeEmptyKeys(this.getAttributes()));
  }

  /**
   * Remove empty keys from the log item.
   * @param {LogAttributes} attributes - The attributes to remove empty keys from.
   */
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

  /**
   * Set the attributes of the log item.
   * @param {LogAttributes} attributes - The attributes to set for the log item.
   */
  public setAttributes(attributes: LogAttributes): void {
    this.attributes = attributes;
  }
}

export { LogItem };
