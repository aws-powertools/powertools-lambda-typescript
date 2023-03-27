const MetricResolution = {
  Standard: 60,
  High: 1,
} as const;

type MetricResolution = typeof MetricResolution[keyof typeof MetricResolution];

export { MetricResolution };