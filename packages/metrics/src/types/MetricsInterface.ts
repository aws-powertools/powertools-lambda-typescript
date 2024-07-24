import type { HandlerMethodDecorator } from '@aws-lambda-powertools/commons/types';
import type { Metrics } from '../Metrics.js';
import type {
  Dimensions,
  EmfOutput,
  MetricResolution,
  MetricUnit,
  MetricsOptions,
} from './Metrics.js';

interface MetricsInterface {
  addDimension(name: string, value: string): void;
  addDimensions(dimensions: { [key: string]: string }): void;
  addMetadata(key: string, value: string): void;
  addMetric(
    name: string,
    unit: MetricUnit,
    value: number,
    resolution?: MetricResolution
  ): void;
  clearDimensions(): void;
  clearMetadata(): void;
  clearMetrics(): void;
  clearDefaultDimensions(): void;
  logMetrics(options?: MetricsOptions): HandlerMethodDecorator;
  publishStoredMetrics(): void;
  serializeMetrics(): EmfOutput;
  setDefaultDimensions(dimensions: Dimensions | undefined): void;
  singleMetric(): Metrics;
}

export type { MetricsInterface };
