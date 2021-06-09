// import { MetricUnit, LogItemMessage } from '../types';

import { MetricUnit } from '../types';

interface MetricsInterface {
  addMetric(name: string, unit:MetricUnit, value:number): void
  clearMetrics(): void
  logMetrics(): void
  addDimension(name: string, value: string): void
  addMetadata(key: string, value: string): void
  clearMetadata(): void
  clearDimensions(): void
}

export {
  MetricsInterface
};