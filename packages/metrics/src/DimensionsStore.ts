import '@aws/lambda-invoke-store';
import { shouldUseInvokeStore } from '@aws-lambda-powertools/commons/utils/env';
import type { Dimensions } from './types/Metrics.js';

/**
 * Manages storage of metrics dimensions with automatic context detection.
 *
 * This class abstracts the storage mechanism for metrics, automatically
 * choosing between AsyncLocalStorage (when in async context) and a fallback
 * object (when outside async context). The decision is made at runtime on
 * every method call to support Lambda's transition to async contexts.
 */
class DimensionsStore {
  readonly #dimensionsKey = Symbol('powertools.metrics.dimensions');
  readonly #dimensionSetsKey = Symbol('powertools.metrics.dimensionSets');

  #fallbackDimensions: Dimensions = {};
  #fallbackDimensionSets: Dimensions[] = [];
  #defaultDimensions: Dimensions = {};

  #getDimensions(): Dimensions {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackDimensions;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    let stored = store.get(this.#dimensionsKey) as Dimensions | undefined;
    if (stored == null) {
      stored = {};
      store.set(this.#dimensionsKey, stored);
    }
    return stored;
  }

  #getDimensionSets(): Dimensions[] {
    if (!shouldUseInvokeStore()) {
      return this.#fallbackDimensionSets;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    let stored = store.get(this.#dimensionSetsKey) as Dimensions[] | undefined;
    if (stored == null) {
      stored = [];
      store.set(this.#dimensionSetsKey, stored);
    }
    return stored;
  }

  public addDimension(name: string, value: string): string {
    this.#getDimensions()[name] = value;
    return value;
  }

  public addDimensionSet(dimensionSet: Dimensions): Dimensions {
    this.#getDimensionSets().push({ ...dimensionSet });
    return dimensionSet;
  }

  public getDimensions(): Dimensions {
    return { ...this.#getDimensions() };
  }

  public getDimensionSets(): Dimensions[] {
    return this.#getDimensionSets().map((set) => ({ ...set }));
  }

  public clearRequestDimensions(): void {
    if (!shouldUseInvokeStore()) {
      this.#fallbackDimensions = {};
      this.#fallbackDimensionSets = [];
      return;
    }

    if (globalThis.awslambda?.InvokeStore === undefined) {
      throw new Error('InvokeStore is not available');
    }

    const store = globalThis.awslambda.InvokeStore;
    store.set(this.#dimensionsKey, {});
    store.set(this.#dimensionSetsKey, []);
  }

  public clearDefaultDimensions(): void {
    this.#defaultDimensions = {};
  }

  public getDimensionCount(): number {
    const dimensions = this.#getDimensions();
    const dimensionSets = this.#getDimensionSets();
    const dimensionSetsCount = dimensionSets.reduce(
      (total, dimensionSet) => total + Object.keys(dimensionSet).length,
      0
    );
    return (
      Object.keys(dimensions).length +
      Object.keys(this.#defaultDimensions).length +
      dimensionSetsCount
    );
  }

  public setDefaultDimensions(dimensions: Dimensions): void {
    this.#defaultDimensions = { ...dimensions };
  }

  public getDefaultDimensions(): Dimensions {
    return { ...this.#defaultDimensions };
  }
}

export { DimensionsStore };
