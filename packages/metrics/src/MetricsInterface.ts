import { Metrics } from './Metrics';
import {
  MetricUnit,
  MetricResolution,
  EmfOutput,
  HandlerMethodDecorator,
  Dimensions,
  MetricsOptions,
} from './types';

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

export { MetricsInterface };
