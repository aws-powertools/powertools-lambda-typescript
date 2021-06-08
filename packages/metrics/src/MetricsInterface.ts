// import { MetricUnit, LogItemMessage } from '../types';

import { MetricUnit } from '../types';

interface MetricsInterface {
  addMetric(name: string, unit:MetricUnit, value:unknown): void
}

export {
  MetricsInterface
};