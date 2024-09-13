import merge from 'lodash.merge';
import type { LogAttributes } from '../types/Logger.js';

/**
 * LogItem is a class that holds the attributes of a log item.
 *
 * It is used by {@link LogFormatter} to store the attributes of a log item and to add additional attributes to it.
 */
class LogItem {
  /**
   * The attributes of the log item.
   */
  private attributes: LogAttributes = {};

  /**
   * Constructor for LogItem.
   *
   * Attributes are added in the following order:
   * - Standard keys provided by the logger (e.g. `message`, `level`, `timestamp`)
   * - Persistent attributes provided by developer, not formatted (done later)
   * - Ephemeral attributes provided as parameters for a single log item (done later)
   *
   * @param params - The parameters for the LogItem.
   */
  public constructor(params: { attributes: LogAttributes }) {
    this.addAttributes(params.attributes);
  }

  /**
   * Add attributes to the log item.
   *
   * @param attributes - The attributes to add to the log item.
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
   *
   * This operation removes empty keys from the log item, see {@link removeEmptyKeys | removeEmptyKeys()} for more information.
   */
  public prepareForPrint(): void {
    this.setAttributes(this.removeEmptyKeys(this.getAttributes()));
  }

  /**
   * Remove empty keys from the log item, where empty keys are defined as keys with
   * values of `undefined`, empty strings (`''`), or `null`.
   *
   * @param attributes - The attributes to remove empty keys from.
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
   * Replace the attributes of the log item.
   *
   * @param attributes - The attributes to set for the log item.
   */
  public setAttributes(attributes: LogAttributes): void {
    this.attributes = attributes;
  }
}

export { LogItem };
