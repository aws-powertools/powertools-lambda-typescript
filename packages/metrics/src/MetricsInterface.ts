// import { MetricUnit, LogItemMessage } from '../types';

import { MetricUnit } from '../types';

interface MetricsInterface {
  addMetric(name: string, unit:MetricUnit, value:number): void
  logMetrics(): void
  addDimension(name: string, value: string): void
}

export {
  MetricsInterface
};