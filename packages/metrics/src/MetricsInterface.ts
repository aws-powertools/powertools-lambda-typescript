// import { MetricUnit, LogItemMessage } from '../types';

import { MetricUnit } from '../types';

interface MetricsInterface {
  addMetric(name: string, unit:MetricUnit, value:number): void
  logMetrics(): void
}

export {
  MetricsInterface
};