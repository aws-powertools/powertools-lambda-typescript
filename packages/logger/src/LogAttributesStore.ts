import { deepMerge } from '@aws-lambda-powertools/commons';
import { InvocationScoped } from '@aws-lambda-powertools/commons/utils/invocation-scoped';
import type { LambdaFunctionContext, LogAttributes } from './types/logKeys.js';

/**
 * Manages storage of log attributes with automatic context detection.
 *
 * This class abstracts the storage mechanism for log attributes, automatically
 * choosing between AsyncLocalStorage (when in async context) and a fallback
 * object (when outside async context). The decision is made at runtime on
 * every method call to support Lambda's transition to async contexts.
 */
class LogAttributesStore {
  readonly #temporaryAttributes = new InvocationScoped<LogAttributes>(
    'powertools.logger.temporaryAttributes',
    { fresh: () => ({}) }
  );
  readonly #keys = new InvocationScoped<Map<string, 'temp' | 'persistent'>>(
    'powertools.logger.keys',
    { fresh: () => new Map() }
  );
  readonly #lambdaContext = new InvocationScoped<
    LambdaFunctionContext | undefined
  >('powertools.logger.lambdaContext', { initial: undefined });

  #persistentAttributes: LogAttributes = {};

  #getTemporaryAttributes(): LogAttributes {
    return this.#temporaryAttributes.get();
  }

  #getKeys(): Map<string, 'temp' | 'persistent'> {
    return this.#keys.get();
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

    this.#temporaryAttributes.reset();
  }

  public setLambdaContext(context: LambdaFunctionContext): void {
    this.#lambdaContext.set(context);
  }

  public getLambdaContext(): LambdaFunctionContext | undefined {
    return this.#lambdaContext.get();
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
