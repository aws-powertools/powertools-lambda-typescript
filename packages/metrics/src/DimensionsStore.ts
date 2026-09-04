import { InvocationScoped } from '@aws-lambda-powertools/commons/utils/invocation-scoped';
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
  readonly #dimensions = new InvocationScoped<Dimensions>(
    'powertools.metrics.dimensions',
    { fresh: () => ({}) }
  );
  readonly #dimensionSets = new InvocationScoped<Dimensions[]>(
    'powertools.metrics.dimensionSets',
    { fresh: () => [] }
  );
  #defaultDimensions: Dimensions = {};

  #getDimensions(): Dimensions {
    return this.#dimensions.get();
  }

  #getDimensionSets(): Dimensions[] {
    return this.#dimensionSets.get();
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
    this.#dimensions.reset();
    this.#dimensionSets.reset();
  }

  public clearDefaultDimensions(): void {
    this.#defaultDimensions = {};
  }

  public setDefaultDimensions(dimensions: Dimensions): void {
    this.#defaultDimensions = { ...dimensions };
  }

  public getDefaultDimensions(): Dimensions {
    return { ...this.#defaultDimensions };
  }
}

export { DimensionsStore };
