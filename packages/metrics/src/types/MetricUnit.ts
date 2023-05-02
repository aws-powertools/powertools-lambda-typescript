enum MetricUnits {
  Seconds = 'Seconds',
  Microseconds = 'Microseconds',
  Milliseconds = 'Milliseconds',
  Bytes = 'Bytes',
  Kilobytes = 'Kilobytes',
  Megabytes = 'Megabytes',
  Gigabytes = 'Gigabytes',
  Terabytes = 'Terabytes',
  Bits = 'Bits',
  Kilobits = 'Kilobits',
  Megabits = 'Megabits',
  Gigabits = 'Gigabits',
  Terabits = 'Terabits',
  Percent = 'Percent',
  Count = 'Count',
  BytesPerSecond = 'Bytes/Second',
  KilobytesPerSecond = 'Kilobytes/Second',
  MegabytesPerSecond = 'Megabytes/Second',
  GigabytesPerSecond = 'Gigabytes/Second',
  TerabytesPerSecond = 'Terabytes/Second',
  BitsPerSecond = 'Bits/Second',
  KilobitsPerSecond = 'Kilobits/Second',
  MegabitsPerSecond = 'Megabits/Second',
  GigabitsPerSecond = 'Gigabits/Second',
  TerabitsPerSecond = 'Terabits/Second',
  CountPerSecond = 'Count/Second',
}

type MetricUnitSeconds = MetricUnits.Seconds;
type MetricUnitMicroseconds = MetricUnits.Microseconds;
type MetricUnitMilliseconds = MetricUnits.Milliseconds;
type MetricUnitBytes = MetricUnits.Bytes;
type MetricUnitKilobytes = MetricUnits.Kilobytes;
type MetricUnitMegabytes = MetricUnits.Megabytes;
type MetricUnitGigabytes = MetricUnits.Gigabytes;
type MetricUnitTerabytes = MetricUnits.Terabytes;
type MetricUnitBits = MetricUnits.Bits;
type MetricUnitKilobits = MetricUnits.Kilobits;
type MetricUnitMegabits = MetricUnits.Megabits;
type MetricUnitGigabits = MetricUnits.Gigabits;
type MetricUnitTerabits = MetricUnits.Terabits;
type MetricUnitPercent = MetricUnits.Percent;
type MetricUnitCount = MetricUnits.Count;
type MetricUnitBytesPerSecond = MetricUnits.BytesPerSecond;
type MetricUnitKilobytesPerSecond = MetricUnits.KilobytesPerSecond;
type MetricUnitMegabytesPerSecond = MetricUnits.MegabytesPerSecond;
type MetricUnitGigabytesPerSecond = MetricUnits.GigabytesPerSecond;
type MetricUnitTerabytesPerSecond = MetricUnits.TerabytesPerSecond;
type MetricUnitBitsPerSecond = MetricUnits.BitsPerSecond;
type MetricUnitKilobitsPerSecond = MetricUnits.KilobitsPerSecond;
type MetricUnitMegabitsPerSecond = MetricUnits.MegabitsPerSecond;
type MetricUnitGigabitsPerSecond = MetricUnits.GigabitsPerSecond;
type MetricUnitTerabitsPerSecond = MetricUnits.TerabitsPerSecond;
type MetricUnitCountPerSecond = MetricUnits.CountPerSecond;

type MetricUnit =
  | MetricUnitSeconds
  | MetricUnitMicroseconds
  | MetricUnitMilliseconds
  | MetricUnitBytes
  | MetricUnitKilobytes
  | MetricUnitMegabytes
  | MetricUnitGigabytes
  | MetricUnitTerabytes
  | MetricUnitBits
  | MetricUnitKilobits
  | MetricUnitMegabits
  | MetricUnitGigabits
  | MetricUnitTerabits
  | MetricUnitPercent
  | MetricUnitCount
  | MetricUnitBitsPerSecond
  | MetricUnitBytesPerSecond
  | MetricUnitKilobytesPerSecond
  | MetricUnitMegabytesPerSecond
  | MetricUnitGigabytesPerSecond
  | MetricUnitTerabytesPerSecond
  | MetricUnitKilobitsPerSecond
  | MetricUnitMegabitsPerSecond
  | MetricUnitGigabitsPerSecond
  | MetricUnitTerabitsPerSecond
  | MetricUnitCountPerSecond;

export { MetricUnit, MetricUnits };
