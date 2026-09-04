import { isIntegerNumber } from '@aws-lambda-powertools/commons/typeutils';
import { InvocationScoped } from '@aws-lambda-powertools/commons/utils/invocation-scoped';
import { MetricResolution as MetricResolutions } from './constants.js';
import type {
  MetricResolution,
  MetricUnit,
  StoredMetric,
  StoredMetrics,
} from './types/index.js';

/**
 * Manages storage of metrics with automatic context detection.
 *
 * This class abstracts the storage mechanism for metrics, automatically
 * choosing between AsyncLocalStorage (when in async context) and a fallback
 * object (when outside async context). The decision is made at runtime on
 * every method call to support Lambda's transition to async contexts.
 */
class MetricsStore {
  readonly #storedMetrics = new InvocationScoped<StoredMetrics>(
    'powertools.metrics.storedMetrics',
    { fresh: () => ({}) }
  );
  readonly #timestamp = new InvocationScoped<number | undefined>(
    'powertools.metrics.timestamp',
    { initial: undefined }
  );

  #getStorage(): StoredMetrics {
    return this.#storedMetrics.get();
  }

  public getMetric(name: string): StoredMetric | undefined {
    return this.#getStorage()[name];
  }

  /**
   * Adds a metric value to storage. If a metric with the same name already exists,
   * the value is appended to an array. Validates that the unit matches any existing metric.
   *
   * @example
   * ```typescript
   * store.setMetric('latency', MetricUnit.Milliseconds, 100);
   * // Returns: { name: 'latency', unit: 'Milliseconds', value: 100, resolution: 60 }
   *
   * store.setMetric('latency', MetricUnit.Milliseconds, 150);
   * // Returns: { name: 'latency', unit: 'Milliseconds', value: [100, 150], resolution: 60 }
   * ```
   *
   * @param name - The metric name
   * @param unit - The metric unit (must match existing metric if present)
   * @param value - The metric value to add
   * @param resolution - The metric resolution (defaults to Standard)
   * @returns The stored metric with updated values
   * @throws Error if unit doesn't match existing metric
   */
  public setMetric(
    name: string,
    unit: MetricUnit,
    value: number,
    resolution: MetricResolution = MetricResolutions.Standard
  ): StoredMetric {
    const storage = this.#getStorage();
    const existingMetric = storage[name];

    if (existingMetric === undefined) {
      const newMetric: StoredMetric = {
        name,
        unit,
        value,
        resolution,
      };
      storage[name] = newMetric;
      return { ...newMetric };
    }

    if (existingMetric.unit !== unit) {
      const currentUnit = existingMetric.unit;
      throw new Error(
        `Metric "${name}" has already been added with unit "${currentUnit}", but we received unit "${unit}". Did you mean to use metric unit "${currentUnit}"?`
      );
    }

    if (!Array.isArray(existingMetric.value)) {
      existingMetric.value = [existingMetric.value];
    }
    existingMetric.value.push(value);
    return { ...existingMetric, value: [...existingMetric.value] };
  }

  public getMetricNames(): string[] {
    return Object.keys(this.#getStorage());
  }

  public getAllMetrics(): StoredMetric[] {
    return Object.values(this.#getStorage());
  }

  public clearMetrics(): void {
    this.#storedMetrics.reset();
    this.#timestamp.set(undefined);
  }

  public hasMetrics(): boolean {
    return this.getMetricNames().length > 0;
  }

  public getMetricsCount(): number {
    return this.getMetricNames().length;
  }

  public getTimestamp(): number | undefined {
    return this.#timestamp.get();
  }

  public setTimestamp(timestamp: number | Date): number {
    const timestampMs = this.#convertTimestampToEmfFormat(timestamp);

    this.#timestamp.set(timestampMs);
    return timestampMs;
  }

  #convertTimestampToEmfFormat(timestamp: number | Date): number {
    if (isIntegerNumber(timestamp)) {
      return timestamp;
    }
    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }
    return 0;
  }
}

export { MetricsStore };
