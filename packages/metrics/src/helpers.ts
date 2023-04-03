import { MetricsOptions } from 'types';
import { Metrics } from '.';

const createMetrics = (options: MetricsOptions = {}): Metrics => new Metrics(options);

export {
  createMetrics,
};