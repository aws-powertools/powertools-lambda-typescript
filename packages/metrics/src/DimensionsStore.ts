import { InvokeStore } from '@aws/lambda-invoke-store';
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
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackDimensions;
    }

    let stored = InvokeStore.get(this.#dimensionsKey) as Dimensions | undefined;
    if (stored == null) {
      stored = {};
      InvokeStore.set(this.#dimensionsKey, stored);
    }
    return stored;
  }

  #getDimensionSets(): Dimensions[] {
    if (InvokeStore.getContext() === undefined) {
      return this.#fallbackDimensionSets;
    }

    let stored = InvokeStore.get(this.#dimensionSetsKey) as
      | Dimensions[]
      | undefined;
    if (stored == null) {
      stored = [];
      InvokeStore.set(this.#dimensionSetsKey, stored);
    }
    return stored;
  }

  addDimension(name: string, value: string): string {
    this.#getDimensions()[name] = value;
    return value;
  }

  addDimensionSet(dimensionSet: Dimensions): Dimensions {
    this.#getDimensionSets().push({ ...dimensionSet });
    return dimensionSet;
  }

  getDimensions(): Dimensions {
    return { ...this.#getDimensions() };
  }

  getDimensionSets(): Dimensions[] {
    return this.#getDimensionSets().map((set) => ({ ...set }));
  }

  clearRequestDimensions(): void {
    if (InvokeStore.getContext() === undefined) {
      this.#fallbackDimensions = {};
      this.#fallbackDimensionSets = [];
      return;
    }

    InvokeStore.set(this.#dimensionsKey, {});
    InvokeStore.set(this.#dimensionSetsKey, []);
  }

  clearDefaultDimensions(): void {
    this.#defaultDimensions = {};
  }

  getDimensionCount(): number {
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

  setDefaultDimensions(dimensions: Dimensions): void {
    this.#defaultDimensions = { ...dimensions };
  }

  getDefaultDimensions(): Dimensions {
    return { ...this.#defaultDimensions };
  }
}

export { DimensionsStore };
