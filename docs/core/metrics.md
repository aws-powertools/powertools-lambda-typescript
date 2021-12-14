---
title: Metrics
description: Core utility
---

Metrics creates custom metrics asynchronously by logging metrics to standard output following [Amazon CloudWatch Embedded Metric Format (EMF)](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html).

These metrics can be visualized through [Amazon CloudWatch Console](https://console.aws.amazon.com/cloudwatch/).

## Key features

* Aggregate up to 100 metrics using a single CloudWatch EMF object (large JSON blob)
* Validate against common metric definitions mistakes (metric unit, values, max dimensions, max metrics, etc)
* Metrics are created asynchronously by CloudWatch service, no custom stacks needed
* Context manager to create a one off metric with a different dimension

## Terminologies

If you're new to Amazon CloudWatch, there are two terminologies you must be aware of before using this utility:

* **Namespace**. It's the highest level container that will group multiple metrics from multiple services for a given application, for example `ServerlessEcommerce`.
* **Dimensions**. Metrics metadata in key-value format. They help you slice and dice metrics visualization, for example `ColdStart` metric by Payment `service`.

<figure>
  <img src="../../media/metrics_terminology.png" />
  <figcaption>Metric terminology, visually explained</figcaption>
</figure>

## Getting started

Metric has two global settings that will be used across all metrics emitted:

Setting | Description | Environment variable | Constructor parameter
------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------
**Metric namespace** | Logical container where all metrics will be placed e.g. `ServerlessAirline` |  `POWERTOOLS_METRICS_NAMESPACE` | `namespace`
**Service** | Optionally, sets **service** metric dimension across all metrics e.g. `payment` | `POWERTOOLS_SERVICE_NAME` | `service`

!!! tip "Use your application or main service as the metric namespace to easily group all metrics"

> Example using AWS Serverless Application Model (SAM)

=== "template.yml"

    ```yaml hl_lines="9 10"
    Resources:
      HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs14.x
          Environment:
          Variables:
            POWERTOOLS_SERVICE_NAME: payment
            POWERTOOLS_METRICS_NAMESPACE: ServerlessAirline
    ```

[//]:# (START EDITING FROM HERE DOWN)

=== "index.ts"

    ```typescript hl_lines="5 7"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';


    // Sets metric namespace and service via env var
    const metrics = new Metrics();
    // OR Sets metric namespace, and service as a metrics parameters
    const metrics = new Metrics({namespace:"ServerlessAirline", service:"orders"});
    ```

You can initialize Metrics anywhere in your code - It'll keep track of your aggregate metrics in memory.

### Creating metrics

You can create metrics using `addMetric`, and you can create dimensions for all your aggregate metrics using `addDimension` method.

=== "Metrics"

    ```typescript hl_lines="8"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda'; 


    const metrics = new Metrics({namespace:"ServerlessAirline", service:"orders"});

    export const handler = async (event: any, context: Context) => {
        metrics.addMetric('SuccessfulBooking', MetricUnits.Count, 1);
    }
    ```
=== "Metrics with custom dimensions"

    ```typescript hl_lines="8-9"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda';


    const metrics = new Metrics({namespace:"ServerlessAirline", service:"orders"});

    export const handler = async (event: any, context: Context) => {
        metrics.addDimension('environment', 'prod');
        metrics.addMetric('SuccessfulBooking', MetricUnits.Count, 1);
    }
    ```

!!! tip "Autocomplete Metric Units"
    `MetricUnit` enum facilitate finding a supported metric unit by CloudWatch. Alternatively, you can pass the value as a string if you already know them e.g. "Count".

!!! note "Metrics overflow"
    CloudWatch EMF supports a max of 100 metrics per batch. Metrics utility will flush all metrics when adding the 100th metric. Subsequent metrics, e.g. 101th, will be aggregated into a new EMF object, for your convenience.

!!! warning "Do not create metrics or dimensions outside the handler"
    Metrics or dimensions added in the global scope will only be added during cold start. Disregard if that's the intended behaviour.

### Adding default dimensions

You can use `setDefaultDimensions` method to persist dimensions across Lambda invocations.

If you'd like to remove them at some point, you can use `clearDefaultDimensions` method.

=== "setDefaultDimensions method"

    ```typescript hl_lines="5"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda'; 

    const metrics = new Metrics({namespace:"ServerlessAirline", service:"orders"});
    metrics.setDefaultDimensions({ 'environment': 'prod', 'anotherDimension': 'whatever' });

    export const handler = async (event: any, context: Context) => {
        metrics.addMetric('SuccessfulBooking', MetricUnits.Count, 1);
    }
    ```

=== "with logMetrics decorator"

    ```typescript hl_lines="6 11"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context, Callback } from 'aws-lambda'; 


    const metrics = new Metrics({namespace:"ServerlessAirline", service:"orders"});
    const DEFAULT_DIMENSIONS = {"environment": "prod", "another": "one"};


    export class MyFunction {

    @metrics.logMetrics({defaultDimensions: DEFAULT_DIMENSIONS})
    public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
        metrics.addMetric('SuccessfulBooking', MetricUnits.Count, 1);
    }
    ```

### Flushing metrics

As you finish adding all your metrics, you need to serialize and flush them to standard output.

#### Using Decorator

 You can do that automatically with the `logMetrics` decorator.

!!! warning
    Decorators can only be attached to a class declaration, method, accessor, property, or parameter. Therefore, if you are more into standard function, check the next section instead. See the [official doc](https://www.typescriptlang.org/docs/handbook/decorators.html) for more details.

This decorator also **validates**, **serializes**, and **flushes** all your metrics. During metrics validation, if no metrics are provided then a warning will be logged, but no exception will be raised.

```typescript hl_lines="8"
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Context, Callback } from 'aws-lambda'; 

const metrics = new Metrics({namespace:"ExampleApplication", service:"ExampleService"});

export class MyFunction {

    @metrics.logMetrics()
    public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
        metrics.addMetric('BookingConfirmation', MetricUnits.Count, 1);
    }
}
```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="2 7 10 15 22"
    {
        "BookingConfirmation": 1.0,
        "_aws": {
        "Timestamp": 1592234975665,
        "CloudWatchMetrics": [
            {
            "Namespace": "ExampleApplication",
            "Dimensions": [
                [
                "service"
                ]
            ],
            "Metrics": [
                {
                "Name": "BookingConfirmation",
                "Unit": "Count"
                }
            ]
            }
        ]
        },
        "service": "ExampleService"
    }
    ```

!!! tip "Metric validation"
    If metrics are provided, and any of the following criteria are not met, **`SchemaValidationError`** exception will be raised:

    * Maximum of 9 dimensions
    * Namespace is set, and no more than one
    * Metric units must be [supported by CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_MetricDatum.html)

#### Manually

If you prefer not to use `logMetrics` decorator because you might want to encapsulate additional logic or avoid having to go for classes encapsulation when doing so, you can manually flush with `purgeStoredMetrics` and clear metrics as follows:

!!! warning
    Metrics, dimensions and namespace validation still applies.

```typescript hl_lines="8"
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics();

const lambdaHandler: Handler = async () => {
    metrics.addMetric('test-metric', MetricUnits.Count, 10);
    const metricsObject = metrics.serializeMetrics();
    metrics.purgeStoredMetrics();
    console.log(JSON.stringify(metricsObject));
};
```

#### Raising SchemaValidationError on empty metrics

If you want to ensure that at least one metric is emitted, you can pass `raiseOnEmptyMetrics` to the **logMetrics** decorator:

```typescript hl_lines="7"
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics();

class Lambda implements LambdaInterface {

    @metrics.logMetrics({raiseOnEmptyMetrics: true})
    public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
        // This will throw an error unless at least one metric is added
    }
}
```

### Capturing cold start metric

You can optionally capture cold start metrics with `logMetrics` decorator via `captureColdStartMetric` param.

```typescript hl_lines="7"
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics();

class Lambda implements LambdaInterface {

    @metrics.logMetrics({ captureColdStartMetric: true })
    public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
        ...
```

If it's a cold start invocation, this feature will:

* Create a separate EMF blob solely containing a metric named `ColdStart`
* Add `function_name` and `service` dimensions

This has the advantage of keeping cold start metric separate from your application metrics, where you might have unrelated dimensions.

!!! info "We do not emit 0 as a value for ColdStart metric for cost reasons. [Let us know](https://github.com/awslabs/aws-lambda-powertools-typecsript/issues/new?assignees=&labels=feature-request%2C+triage&template=feature_request.md&title=) if you'd prefer a flag to override it"

## Advanced

### Adding metadata

You can add high-cardinality data as part of your Metrics log with `addMetadata` method. This is useful when you want to search highly contextual information along with your metrics in your logs.

!!! info
    **This will not be available during metrics visualization** - Use **dimensions** for this purpose

```typescript hl_lines="9"
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

const metrics = new Metrics();

class Lambda implements LambdaInterface {

    @metrics.logMetrics()
    public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
        metrics.addMetadata('booking_id', 'booking_uuid');
        //Your Logic
    }
}
```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="23"
    {
        "SuccessfulBooking": 1.0,
        "_aws": {
        "Timestamp": 1592234975665,
        "CloudWatchMetrics": [
            {
            "Namespace": "ExampleApplication",
            "Dimensions": [
                [
                "service"
                ]
            ],
            "Metrics": [
                {
                "Name": "SuccessfulBooking",
                "Unit": "Count"
                }
            ]
            }
        ]
        },
        "service": "booking",
        "booking_id": "booking_uuid"
    }
    ```

### Single metric with a different dimension

CloudWatch EMF uses the same dimensions across all your metrics. Use `singleMetric` if you have a metric that should have different dimensions.

!!! info
    Generally, this would be an edge case since you [pay for unique metric](https://aws.amazon.com/cloudwatch/pricing). Keep the following formula in mind:

    **unique metric = (metric_name + dimension_name + dimension_value)**



    ```typescript hl_lines="6-7"
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
