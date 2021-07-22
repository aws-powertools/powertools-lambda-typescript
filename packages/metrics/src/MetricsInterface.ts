import { Metrics } from './Metrics';
import { MetricUnit, EmfOutput, HandlerMethodDecorator, Dimensions, DecoratorOptions } from '../types';

interface MetricsInterface {
  addMetric(name: string, unit:MetricUnit, value:number): void
  clearMetrics(): void
  logMetrics(options?: DecoratorOptions): HandlerMethodDecorator
  addDimension(name: string, value: string): void
  addDimensions(dimensions: {[key: string]: string}): void
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