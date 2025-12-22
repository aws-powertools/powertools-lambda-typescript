import '@aws/lambda-invoke-store';
import { deepMerge } from '@aws-lambda-powertools/commons';
import { shouldUseInvokeStore } from '@aws-lambda-powertools/commons/utils/env';
import type { LogAttributes } from './types/logKeys.js';

/**
 * Manages storage of log attributes with automatic context detection.
 *
 * This class abstracts the storage mechanism for log attributes, automatically
 * choosing between AsyncLocalStorage (when in async context) and a fallback
 * object (when outside async context). The decision is made at runtime on
 * every method call to support Lambda's transition to async contexts.
 */
class LogAttributesStore {
  readonly #temporaryAttributesKey = Symbol(
    'powertools.logger.temporaryAttributes'
  );
  readonly #keysKey = Symbol('powertools.logger.keys');

  #fallbackTemporaryAttributes: LogAttributes = {};
  readonly #fallbackKeys: Map<string, 'temp' | 'persistent'> = new Map();
  #persistentAttributes: LogAttributes = {};

  #getTemporaryAttributes(): LogAttributes {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackTemporaryAttributes;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    let stored = store.get(this.#temporaryAttributesKey) as
      | LogAttributes
      | undefined;
    if (stored == null) {
      stored = {};
      store.set(this.#temporaryAttributesKey, stored);
    }
    return stored;
  }

  #getKeys(): Map<string, 'temp' | 'persistent'> {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackKeys;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    let stored = store.get(this.#keysKey) as
      | Map<string, 'temp' | 'persistent'>
      | undefined;
    if (stored == null) {
      stored = new Map();
      store.set(this.#keysKey, stored);
    }
    return stored;
  }

  public appendTemporaryKeys(attributes: LogAttributes): void {
    const tempAttrs = this.#getTemporaryAttributes();
    deepMerge(tempAttrs, attributes);

    const keysMap = this.#getKeys();
    for (const key of Object.keys(attributes)) {
      keysMap.set(key, 'temp');
    }
  }

  public removeTemporaryKeys(keys: string[]): void {
    const tempAttrs = this.#getTemporaryAttributes();
    const keysMap = this.#getKeys();

    for (const key of keys) {
      tempAttrs[key] = undefined;

      if (this.#persistentAttributes[key]) {
        keysMap.set(key, 'persistent');
      } else {
        keysMap.delete(key);
      }
    }
  }

  public getTemporaryAttributes(): LogAttributes {
    return { ...this.#getTemporaryAttributes() };
  }

  public clearTemporaryAttributes(): void {
    const tempAttrs = this.#getTemporaryAttributes();
    const keysMap = this.#getKeys();

    for (const key of Object.keys(tempAttrs)) {
      if (this.#persistentAttributes[key]) {
        keysMap.set(key, 'persistent');
      } else {
        keysMap.delete(key);
      }
    }

    if (!shouldUseInvokeStore()) {
      this.#fallbackTemporaryAttributes = {};
      return;
    }

    globalThis.awslambda.InvokeStore?.set(this.#temporaryAttributesKey, {});
  }

  public setPersistentAttributes(attributes: LogAttributes): void {
    const keysMap = this.#getKeys();
    this.#persistentAttributes = { ...attributes };

    for (const key of Object.keys(attributes)) {
      keysMap.set(key, 'persistent');
    }
  }

  public getPersistentAttributes(): LogAttributes {
    return { ...this.#persistentAttributes };
  }

  public getAllAttributes(): LogAttributes {
    const result: LogAttributes = {};
    const tempAttrs = this.#getTemporaryAttributes();
    const keysMap = this.#getKeys();

    // First add all persistent attributes
    for (const [key, value] of Object.entries(this.#persistentAttributes)) {
      if (value !== undefined) {
        result[key] = value;
      }
    }

    // Then override with temporary attributes based on keysMap
    for (const [key, type] of keysMap.entries()) {
      if (type === 'temp' && tempAttrs[key] !== undefined) {
        result[key] = tempAttrs[key];
      }
    }

    return result;
  }

  public removePersistentKeys(keys: string[]): void {
    const keysMap = this.#getKeys();
    const tempAttrs = this.#getTemporaryAttributes();

    for (const key of keys) {
      this.#persistentAttributes[key] = undefined;

      if (tempAttrs[key]) {
        keysMap.set(key, 'temp');
      } else {
        keysMap.delete(key);
      }
    }
  }
}

export { LogAttributesStore };
