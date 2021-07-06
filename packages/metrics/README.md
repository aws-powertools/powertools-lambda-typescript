# `Metrics`


##  Usage

```bash
npm run test

npm run example:hello-world
npm run example:hello-world
npm run example:manual-flushing
npm run example:dimensions
npm run example:default-dimensions
npm run example:empty-metrics
npm run example:single-metric
npm run example:cold-start
```

### Getting started

```typescript
// Import the library
import { Metrics, MetricUnits } from '../src';
// When going public, it will be something like: import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world-service';

// Instantiate the Logger with default configuration
const metrics = new metrics();

// Add an example Metric
metrics.addMetric('test-metric', MetricUnits.Count, 10);

//Print resulting data
const metricsObject = metrics.serializeMetrics();
metrics.clearMetrics();
console.log(JSON.stringify(metricsObject));

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  "_aws":{
  "Timestamp":1625587915573,
  "CloudWatchMetrics":
    [
      {
        "Namespace":"hello-world",
        "Dimensions":[["service"]],
        "Metrics":
          [
            {
              "Name":"test-metric",
              "Unit":"Count"
            }
          ]
      }
    ]
  },
  "service":"hello-world-service",
  "test-metric":10
}

```
</details>

With decorators:

```typescript

import { Metrics, MetricUnits } from '../src';

process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world-service';

// Instantiate the Logger with default configuration
const metrics = new metrics();

class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addDimension('OuterDimension', 'true');
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
  }

}

```

### Capturing cold start

By default the cold start metric is not captured, it can however be enabled using a parameter passed to the logMetrics decorator



```typescript

import { Metrics, MetricUnits } from '../src';

process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world-service';

// Instantiate the Logger with default configuration
const metrics = new metrics();

class Lambda implements LambdaInterface {

  @metrics.logMetrics({ captureColdStartMetric: true }))
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addDimension('OuterDimension', 'true');
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
  }

}

```
> Please note, we do not emit a 0 value for the ColdStart metric, for cost reasons
<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  "_aws":{
  "Timestamp":1625587915572,
  "CloudWatchMetrics":
    [
      {
        "Namespace":"hello-world",
        "Dimensions":[[
          "service","function_name"
        ]],
        "Metrics":
          [
            {
              "Name":"ColdStart",
              "Unit":"Count"
            }
          ]
      }
    ]
  },
  "service":"hello-world-service",
  "function_name":"foo-bar-function",
  "ColdStart":1
}
{
  "_aws":{
  "Timestamp":1625587915573,
  "CloudWatchMetrics":
    [
      {
        "Namespace":"hello-world",
        "Dimensions":[["service"]],
        "Metrics":
          [
            {
              "Name":"test-metric",
              "Unit":"Count"
            }
          ]
      }
    ]
  },
  "service":"hello-world-service",
  "test-metric":10
}

```
</details>