import '@aws/lambda-invoke-store';
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
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackDimensions;
    }

    let stored = invokeStore.get(this.#dimensionsKey) as Dimensions | undefined;
    if (stored == null) {
      stored = {};
      invokeStore.set(this.#dimensionsKey, stored);
    }
    return stored;
  }

  #getDimensionSets(): Dimensions[] {
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      return this.#fallbackDimensionSets;
    }

    let stored = invokeStore.get(this.#dimensionSetsKey) as
      | Dimensions[]
      | undefined;
    if (stored == null) {
      stored = [];
      invokeStore.set(this.#dimensionSetsKey, stored);
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
    const invokeStore = globalThis.awslambda?.InvokeStore;
    if (invokeStore?.getContext() === undefined) {
      this.#fallbackDimensions = {};
      this.#fallbackDimensionSets = [];
      return;
    }

    invokeStore.set(this.#dimensionsKey, {});
    invokeStore.set(this.#dimensionSetsKey, []);
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
