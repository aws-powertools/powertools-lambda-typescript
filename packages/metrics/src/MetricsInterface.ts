// import { MetricUnit, LogItemMessage } from '../types';

import { MetricUnit, EmfOutput, HandlerMethodDecorator, Dimensions, DecoratorOptions } from '../types';
import { Metrics } from './Metrics';

interface MetricsInterface {
  addMetric(name: string, unit:MetricUnit, value:number): void
  clearMetrics(): void
  logMetrics(options?: DecoratorOptions): HandlerMethodDecorator
  addDimension(name: string, value: string): void
  addMetadata(key: string, value: string): void
  clearMetadata(): void
  clearDimensions(): void
  clearDefaultDimensions(): void
  serializeMetrics(): EmfOutput
  setDefaultDimensions(dimensions: Dimensions): void
  singleMetric(): Metrics
}

export {
  MetricsInterface
};