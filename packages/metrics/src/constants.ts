/**
 * The dimension key for the cold start metric.
 */
const COLD_START_METRIC = 'ColdStart';
/**
 * The default namespace for metrics.
 */
const DEFAULT_NAMESPACE = 'default_namespace';
/**
 * The minimum length constraint of the metric name
 */
const MIN_METRIC_NAME_LENGTH = 1;
/**
 * The maximum length constraint of the metric name
 */
const MAX_METRIC_NAME_LENGTH = 255;
/**
 * The maximum number of metrics that can be emitted in a single EMF blob.
 */
const MAX_METRICS_SIZE = 100;
/**
 * The maximum number of metric values that can be emitted in a single metric.
 */
const MAX_METRIC_VALUES_SIZE = 100;
/**
 * The maximum number of dimensions that can be added to a metric (0-indexed).
 */
const MAX_DIMENSION_COUNT = 29;
/**
 * The maximum age of a timestamp in milliseconds that can be emitted in a metric.
 * This is set to 14 days.
 */
const EMF_MAX_TIMESTAMP_PAST_AGE = 14 * 24 * 60 * 60 * 1000;
/**
 * The maximum age of a timestamp in milliseconds that can be emitted in a metric.
 * This is set to 2 hours.
 */
const EMF_MAX_TIMESTAMP_FUTURE_AGE = 2 * 60 * 60 * 1000;

/**
 * The unit of the metric.
 *
 * @see {@link https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Unit | Amazon CloudWatch Units}
 * @see {@link https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_MetricDatum.html | Amazon CloudWatch MetricDatum}
 */
const MetricUnit = {
  Seconds: 'Seconds',
  Microseconds: 'Microseconds',
  Milliseconds: 'Milliseconds',
  Bytes: 'Bytes',
  Kilobytes: 'Kilobytes',
  Megabytes: 'Megabytes',
  Gigabytes: 'Gigabytes',
  Terabytes: 'Terabytes',
  Bits: 'Bits',
  Kilobits: 'Kilobits',
  Megabits: 'Megabits',
  Gigabits: 'Gigabits',
  Terabits: 'Terabits',
  Percent: 'Percent',
  Count: 'Count',
  BytesPerSecond: 'Bytes/Second',
  KilobytesPerSecond: 'Kilobytes/Second',
  MegabytesPerSecond: 'Megabytes/Second',
  GigabytesPerSecond: 'Gigabytes/Second',
  TerabytesPerSecond: 'Terabytes/Second',
  BitsPerSecond: 'Bits/Second',
  KilobitsPerSecond: 'Kilobits/Second',
  MegabitsPerSecond: 'Megabits/Second',
  GigabitsPerSecond: 'Gigabits/Second',
  TerabitsPerSecond: 'Terabits/Second',
  CountPerSecond: 'Count/Second',
  NoUnit: 'None',
} as const;

/**
 * The resolution of the metric.
 *
 * @see {@link https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Resolution_definition | Amazon CloudWatch Resolution}
 */
const MetricResolution = {
  Standard: 60,
  High: 1,
} as const;

export {
  COLD_START_METRIC,
  DEFAULT_NAMESPACE,
  MIN_METRIC_NAME_LENGTH,
  MAX_METRIC_NAME_LENGTH,
  MAX_METRICS_SIZE,
  MAX_METRIC_VALUES_SIZE,
  MAX_DIMENSION_COUNT,
  MetricUnit,
  MetricResolution,
  EMF_MAX_TIMESTAMP_PAST_AGE,
  EMF_MAX_TIMESTAMP_FUTURE_AGE,
};
