const COLD_START_METRIC = 'ColdStart';
const DEFAULT_NAMESPACE = 'default_namespace';
const MAX_METRICS_SIZE = 100;
const MAX_METRIC_VALUES_SIZE = 100;
const MAX_DIMENSION_COUNT = 29;

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

const MetricResolution = {
  Standard: 60,
  High: 1,
} as const;

export {
  COLD_START_METRIC,
  DEFAULT_NAMESPACE,
  MAX_METRICS_SIZE,
  MAX_METRIC_VALUES_SIZE,
  MAX_DIMENSION_COUNT,
  MetricUnit,
  MetricResolution,
};
