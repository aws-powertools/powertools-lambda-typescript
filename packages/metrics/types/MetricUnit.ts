type MetricUnitSeconds = 'Seconds';
type MetricUnitMicroseconds = 'Microseconds';
type MetricUnitMilliseconds = 'Milliseconds';
type MetricUnitBytes = 'Bytes';
type MetricUnitKilobytes = 'Kilobytes';
type MetricUnitMegabytes = 'Megabytes';
type MetricUnitGigabytes = 'Gigabytes';
type MetricUnitTerabytes = 'Terabytes';
type MetricUnitBits = 'Bits';
type MetricUnitKilobits = 'Kilobits';
type MetricUnitMegabits = 'Megabits';
type MetricUnitGigabits = 'Gigabits';
type MetricUnitTerabits = 'Terabits';
type MetricUnitPercent = 'Percent';
type MetricUnitCount = 'Count';
type MetricUnitBytesPerSecond = 'Bytes/Second';
type MetricUnitKilobytesPerSecond = 'Kilobytes/Second';
type MetricUnitMegabytesPerSecond = 'Megabytes/Second';
type MetricUnitGigabytesPerSecond = 'Gigabytes/Second';
type MetricUnitTerabytesPerSecond = 'Terabytes/Second';
type MetricUnitBitsPerSecond = 'Bits/Second';
type MetricUnitKilobitsPerSecond = 'Kilobits/Second';
type MetricUnitMegabitsPerSecond = 'Megabits/Second';
type MetricUnitGigabitsPerSecond = 'Gigabits/Second';
type MetricUnitTerabitsPerSecond = 'Terabits/Second';
type MetricUnitCountPerSecond = 'Count/Second';

type MetricUnit =
    MetricUnitSeconds
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

export {
  MetricUnit
};