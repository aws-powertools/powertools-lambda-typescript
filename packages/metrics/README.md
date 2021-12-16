# `Metrics`


##  Usage

```bash
npm run test

npm run example:hello-world
npm run example:constructor-options
npm run example:manual-flushing
npm run example:programatic-access
npm run example:dimensions
npm run example:default-dimensions
npm run example:default-dimensions-constructor
npm run example:empty-metrics
npm run example:single-metric
npm run example:cold-start
```

### Getting started

Metrics has two global settings that will be used across all metrics emitted:

|Setting|Description|Environment Variable|Constructor Parameter|
|---|---|---|---|
|Metric namespace|Logical container where all metrics will be placed e.g. ServerlessAirline|POWERTOOLS_METRICS_NAMESPACE|namespace|
|Service|Optionally, sets service metric dimension across all metrics e.g. payment|POWERTOOLS_SERVICE_NAME|service|

```typescript
// Import the library
import { Metrics, MetricUnits } from '../src';
// When going public, it will be something like: import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world-service';

// Instantiate the Logger with default configuration
const metrics = new Metrics();

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
const metrics = new Metrics();

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
const metrics = new Metrics();

class Lambda implements LambdaInterface {

  @metrics.logMetrics({ captureColdStartMetric: true })
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
  }

}

```

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

> Please note, we do not emit a 0 value for the ColdStart metric, for cost reasons

If it's a cold start invocation, this feature will:

- Create a separate EMF blob solely containing a metric named ColdStart
- Add function_name and service dimensions

This has the advantage of keeping cold start metric separate from your application metrics, where you might have unrelated dimensions.

### Creating Metrics

You can create metrics using addMetric, and you can create dimensions for all your aggregate metrics using addDimension method.

```typescript

import { Metrics, MetricUnits } from '../src';

process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world-service';

// Instantiate the Logger with default configuration
const metrics = new Metrics();

class Lambda implements LambdaInterface {

  @metrics.logMetrics({ captureColdStartMetric: true })
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addDimension('OuterDimension', 'true'); //Optional -  add custom dimensions
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
  }

}

```
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
          "service",
          "OuterDimension"
        ]],
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
  "OuterDimension": "true",
  "service":"hello-world-service",
  "test-metric": 10
}

```
</details>

> ### Autocomplete Metric Units
> MetricUnits will facilitate finding a supported metric unit by CloudWatch. Alternatively, you can pass the value as a string if you already know them e.g. "Count".

> ### Metrics Overflow
> CloudWatch EMF supports a max of 100 metrics per batch. Metrics utility will flush all metrics when adding the 100th metric. Subsequent metrics, e.g. 101th, will be aggregated into a new EMF object, for your convenience.

>### ! Do not create metrics or dimensions outside the handler
> Metrics or dimensions added in the global scope will only be added during cold start. Disregard if that's the intended behaviour.
 
### Adding default dimensions
You can use either setDefaultDimensions method or by passing a defaultDimensions object to either the decorator or to the constructor

If you'd like to remove them at some point, you can use clearDefaultDimensions method.
```typescript
import { Metrics, MetricUnits } from '../src';

const metrics = new Metrics();
metrics.setDefaultDimensions({ 'application': 'hello-world' });
class Lambda implements LambdaInterface {
  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addMetric('new-test-metric', MetricUnits.Count, 5);
  }

}
```

With decorators:
```typescript
import { Metrics, MetricUnits } from '../src';

const metrics = new Metrics();

class Lambda implements LambdaInterface {
  @metrics.logMetrics({ defaultDimensions:{ 'application': 'hello-world' } })
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addMetric('new-test-metric', MetricUnits.Count, 5);
  }

}
```
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
          "application"
        ]],
        "Metrics":
          [
            {
              "Name":"new-test-metric",
              "Unit":"Count"
            }
          ]
      }
    ]
  },
  "application":"hello-world",
  "new-test-metric": 5
}

```
</details>

### Flushing Metrics

As you finish adding all your metrics, you need to serialize and flush them to standard output. You can do that automatically with the logMetrics decorator.

This decorator also serializes, and flushes all your metrics. During metrics validation, if no metrics are provided then a warning will be logged, but no exception will be raised.

```typescript
class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addMetric('test-metric', MetricUnits.Count, 10);

  }

}
```

If you need to log the metrics from within your code or if you do not wish to use the decorator, you can do this by calling the purgeStoredMetrics method.

This will serialize, and flush all your metrics.
```typescript
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world-service';
const metrics = new Metrics();

const lambdaHandler: Handler = async () => {

  metrics.addMetric('test-metric', MetricUnits.Count, 10);
  const metricsObject = metrics.serializeMetrics();
  metrics.purgeStoredMetrics();
  console.log(JSON.stringify(metricsObject));

  return {
    foo: 'bar'
  };

};
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

If you just need to clear the metrics manually you can do this by calling the clearMetrics method
```typescript
class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
    metrics.clearMetrics();

  }

}
```

#### Getting programmatic access to stored metrics 
If you need to get programmatic access to the current stored metrics you can do this by calling the serializeMetrics method.

This will not clear any metrics that are currently stored, if you need to do this, you can use the clearMetrics method as described above.
```typescript
process.env.POWERTOOLS_METRICS_NAMESPACE = 'hello-world';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world-service';
class Lambda implements LambdaInterface {
  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    metrics.addMetric('test-metric', MetricUnits.Count, 15);
    const metricsObject = metrics.serializeMetrics();
    console.log(JSON.stringify(metricsObject));
  }

}
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
  "test-metric":15
}

```
</details>

### Raising SchemaValidationError on empty metrics

If you want to ensure that at least one metric is emitted, you can pass raiseOnEmptyMetrics to the logMetrics decorator:

```typescript
class Lambda implements LambdaInterface {

  @metrics.logMetrics({raiseOnEmptyMetrics: true})
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    // This will throw an error unless at least one metric is added
  }

}
```

### Adding metadata
You can add high-cardinality data as part of your Metrics log with addMetadata method. This is useful when you want to search highly contextual information along with your metrics in your logs.
>### Info
> This will not be available during metrics visualization - Use dimensions for this purpose
```typescript
class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  metrics.addMetadata('metadata_name', 'metadata_value')
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    //Your Logic
  }

}
```

### Single metric with a different dimension

CloudWatch EMF uses the same dimensions across all your metrics. Use the ```singleMetric``` method if you have a metric that should have different dimensions.

```typescript
class Lambda implements LambdaInterface {

  @metrics.logMetrics()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
    const singleMetric = metrics.singleMetric();
    metrics.addDimension('OuterDimension', 'true');
    singleMetric.addDimension('InnerDimension', 'true');
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
    singleMetric.addMetric('single-metric', MetricUnits.Percent, 50);
  }

}
```
>### Info
> Generally, this would be an edge case since you pay for unique metric. Keep the following formula in mind:
>
> **unique metric = (metric_name + dimension_name + dimension_value)**