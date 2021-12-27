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
**Metric namespace** | Logical container where all metrics will be placed e.g. `serverlessAirline` |  `POWERTOOLS_METRICS_NAMESPACE` | `namespace`
**Service** | Optionally, sets **service** metric dimension across all metrics e.g. `payment` | `POWERTOOLS_SERVICE_NAME` | `service`

!!! tip "Use your application or main service as the metric namespace to easily group all metrics"

> Example using AWS Serverless Application Model (SAM)

=== "index.ts"

    ```typescript hl_lines="5 7"
    import { Metrics } from '@aws-lambda-powertools/metrics';


    // Sets metric namespace and service via env var
    const metrics = new Metrics();
    // OR Sets metric namespace, and service as a metrics parameters
    const metrics = new Metrics({namespace:"serverlessAirline", service:"orders"});
    ```

=== "sam-template.yml"

    ```yaml hl_lines="9 10"
    Resources:
      HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs14.x
          Environment:
          Variables:
            POWERTOOLS_SERVICE_NAME: payment
            POWERTOOLS_METRICS_NAMESPACE: serverlessAirline
    ```


You can initialize Metrics anywhere in your code - It'll keep track of your aggregate metrics in memory.

### Creating metrics

You can create metrics using `addMetric`, and you can create dimensions for all your aggregate metrics using `addDimension` method.

=== "Metrics"

    ```typescript hl_lines="8"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda'; 


    const metrics = new Metrics({namespace:"serverlessAirline", service:"orders"});

    export const handler = async (event: any, context: Context) => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    }
    ```
=== "Metrics with custom dimensions"

    ```typescript hl_lines="8-9"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda';


    const metrics = new Metrics({namespace:"serverlessAirline", service:"orders"});

    export const handler = async (event: any, context: Context) => {
        metrics.addDimension('environment', 'prod');
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    }
    ```

!!! tip "Autocomplete Metric Units"
    `MetricUnit` enum facilitate finding a supported metric unit by CloudWatch. Alternatively, you can pass the value as a string if you already know them e.g. "Count".

!!! note "Metrics overflow"
    CloudWatch EMF supports a max of 100 metrics per batch. Metrics utility will flush all metrics when adding the 100th metric. Subsequent metrics, e.g. 101th, will be aggregated into a new EMF object, for your convenience.

!!! warning "Do not create metrics or dimensions outside the handler"
    Metrics or dimensions added in the global scope will only be added during cold start. Disregard if that's the intended behaviour.

### Adding default dimensions

You can use add default dimensions to your metrics by passing them as parameters in 4 ways:  

* in the constructor
* in the Middy middleware
* using the `setDefaultDimensions` method
* in the decorator

If you'd like to remove them at some point, you can use `clearDefaultDimensions` method.  
See examples below:

=== "constructor"

    ```typescript hl_lines="7"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda'; 

    const metrics = new Metrics({
        namespace:"serverlessAirline", 
        service:"orders", 
        defaultDimensions: { 'environment': 'prod', 'anotherDimension': 'whatever' } 
    });

    export const handler = async (event: any, context: Context) => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    }
    ```

=== "Middy middleware"

    ```typescript hl_lines="5"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda';
    import middy from '@middy/core';

    const metrics = new Metrics({ namespace: 'serverlessAirline', service: 'orders' });

    const lambdaHandler = async (event: any, context: Context) => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    }

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics, { defaultDimensions:{ 'environment': 'prod', 'anotherDimension': 'whatever' }  }));
    ```

=== "setDefaultDimensions method"

    ```typescript hl_lines="5"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda'; 

    const metrics = new Metrics({namespace:"serverlessAirline", service:"orders"});
    metrics.setDefaultDimensions({ 'environment': 'prod', 'anotherDimension': 'whatever' });

    export const handler = async (event: any, context: Context) => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    }
    ```

=== "with logMetrics decorator"

    ```typescript hl_lines="9"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context, Callback } from 'aws-lambda';

    const metrics = new Metrics({namespace:"serverlessAirline", service:"orders"});
    const DEFAULT_DIMENSIONS = {"environment": "prod", "another": "one"};

    export class MyFunction {

        @metrics.logMetrics({defaultDimensions: DEFAULT_DIMENSIONS})
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
            metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
        }
    }
    ```

### Flushing metrics

As you finish adding all your metrics, you need to serialize and "flush them" (= print them to standard output).

You can flush metrics automatically using one of the following methods:  

* [Middy-compatible](https://github.com/middyjs/middy){target=_blank} middleware
* class decorator
* manually

Using the Middy middleware or decorator will **automatically validate, serialize, and flush** all your metrics. During metrics validation, if no metrics are provided then a warning will be logged, but no exception will be raised.
If you do not the middleware or decorator, you have to flush your metrics manually.


!!! warning "Metric validation"
    If metrics are provided, and any of the following criteria are not met, a **`RangeError`** exception will be raised:

    * Maximum of 9 dimensions
    * Namespace is set only once (or none)
    * Metric units must be [supported by CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_MetricDatum.html)


#### Using Middy middleware

See below an example of how to automatically flush metrics with the Middy-compatible `logMetrics` middleware.


```typescript hl_lines="3 8 11-12"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda';
    import middy from '@middy/core';

    const metrics = new Metrics({ namespace: 'exampleApplication' , service: 'exampleService' });

    const lambdaHandler = async (event: any, context: Context) => {
        metrics.addMetric('bookingConfirmation', MetricUnits.Count, 1);
    }

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics));
```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="2 7 10 15 22"
    {
        "bookingConfirmation": 1.0,
        "_aws": {
        "Timestamp": 1592234975665,
        "CloudWatchMetrics": [
            {
            "Namespace": "exampleApplication",
            "Dimensions": [
                [
                "service"
                ]
            ],
            "Metrics": [
                {
                "Name": "bookingConfirmation",
                "Unit": "Count"
                }
            ]
            }
        ]
        },
        "service": "exampleService"
    }
    ```

#### Using the class decorator

!!! info
    Decorators can only be attached to a class declaration, method, accessor, property, or parameter. Therefore, if you prefer to write your handler as a standard function rather than a Class method, check the [middleware](#using-a-middleware) or [manual](#manually) method sections instead.  
    See the [official TypeScript documentation](https://www.typescriptlang.org/docs/handbook/decorators.html) for more details.

The `logMetrics` decorator of the metrics utility can be used when your Lambda handler function is implemented as method of a Class.


```typescript hl_lines="8"
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Context, Callback } from 'aws-lambda'; 

const metrics = new Metrics({namespace:"exampleApplication", service:"exampleService"});

export class MyFunction {

    @metrics.logMetrics()
    public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
        metrics.addMetric('bookingConfirmation', MetricUnits.Count, 1);
    }
}
```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="2 7 10 15 22"
    {
        "bookingConfirmation": 1.0,
        "_aws": {
        "Timestamp": 1592234975665,
        "CloudWatchMetrics": [
            {
            "Namespace": "exampleApplication",
            "Dimensions": [
                [
                "service"
                ]
            ],
            "Metrics": [
                {
                "Name": "bookingConfirmation",
                "Unit": "Count"
                }
            ]
            }
        ]
        },
        "service": "exampleService"
    }
    ```


#### Manually

You can manually flush the metrics with `purgeStoredMetrics` as follows:

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

#### Throwing a RangeError when no metrics are emitted

If you want to ensure that at least one metric is emitted before you flush them, you can use the `raiseOnEmptyMetrics` parameter and pass it to the middleware or decorator:

```typescript hl_lines="12"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda';
    import middy from '@middy/core';

    const metrics = new Metrics({namespace:"exampleApplication", service:"exampleService"});

    const lambdaHandler = async (event: any, context: Context) => {
        metrics.addMetric('bookingConfirmation', MetricUnits.Count, 1);
    }

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics, { raiseOnEmptyMetrics: true }));
```

### Capturing a cold start invocation as metric

You can optionally capture cold start metrics with the `logMetrics` middleware or decorator via the `captureColdStartMetric` param.

=== "logMetrics middleware"

    ```typescript hl_lines="12"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda';
    import middy from '@middy/core';

    const metrics = new Metrics({namespace: 'serverlessAirline', service: 'orders' });

    const lambdaHandler = async (event: any, context: Context) => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    }

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics, { captureColdStartMetric: true } }));
    ```

=== "logMetrics decorator"

    ```typescript hl_lines="9"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context, Callback } from 'aws-lambda'; 
    import middy from '@middy/core';

    const metrics = new Metrics({namespace: 'serverlessAirline', service: 'orders' });

    export class MyFunction {

        @metrics.logMetrics({ captureColdStartMetric: true })
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
            metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
        }
    }
    ```

If it's a cold start invocation, this feature will:

* Create a separate EMF blob solely containing a metric named `ColdStart`
* Add `function_name`, `service` and default dimensions

This has the advantage of keeping cold start metric separate from your application metrics, where you might have unrelated dimensions.

!!! info "We do not emit 0 as a value for the ColdStart metric for cost-efficiency reasons. [Let us know](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/new?assignees=&labels=feature-request%2C+triage&template=feature_request.md&title=) if you'd prefer a flag to override it."

## Advanced

### Adding metadata

You can add high-cardinality data as part of your Metrics log with `addMetadata` method. This is useful when you want to search highly contextual information along with your metrics in your logs.

!!! warning
    **This will not be available during metrics visualization** - Use **dimensions** for this purpose

```typescript hl_lines="8"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda';
    import middy from '@middy/core';

    const metrics = new Metrics({namespace:"serverlessAirline", service:"orders"});

    const lambdaHandler = async (event: any, context: Context) => {
        metrics.addMetadata('bookingId', '7051cd10-6283-11ec-90d6-0242ac120003');
    }

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics));
```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="23"
    {
        "successfulBooking": 1.0,
        "_aws": {
        "Timestamp": 1592234975665,
        "CloudWatchMetrics": [
            {
            "Namespace": "exampleApplication",
            "Dimensions": [
                [
                "service"
                ]
            ],
            "Metrics": [
                {
                "Name": "successfulBooking",
                "Unit": "Count"
                }
            ]
            }
        ]
        },
        "service": "booking",
        "bookingId": "7051cd10-6283-11ec-90d6-0242ac120003"
    }
    ```

### Single metric with different dimensions

CloudWatch EMF uses the same dimensions across all your metrics. Use `singleMetric` if you have a metric that should have different dimensions.

!!! info
    For cost-efficiency, this feature would be used sparsely since you [pay for unique metric](https://aws.amazon.com/cloudwatch/pricing). Keep the following formula in mind:

    **unique metric = (metric_name + dimension_name + dimension_value)**


=== "logMetrics middleware"

    ```typescript hl_lines="12 14 15"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda';
    import middy from '@middy/core';

    const metrics = new Metrics({namespace:"serverlessAirline", service:"orders"});

    const lambdaHandler = async (event: any, context: Context) => {
        metrics.addDimension('metricUnit', 'milliseconds');
        // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
        metrics.addMetric('latency', MetricUnits.Milliseconds, 56);
    
        const singleMetric = metrics.singleMetric();
        // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
        singleMetric.addDimension('metricType', 'business');
        singleMetric.addMetric('orderSubmitted', MetricUnits.Count, 1);
    }

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics, { captureColdStartMetric: true } }));
    ```

=== "logMetrics decorator"

    ```typescript hl_lines="14 16 17"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context, Callback } from 'aws-lambda';

    const metrics = new Metrics({namespace:"serverlessAirline", service:"orders"});

    export class MyFunction {

        @metrics.logMetrics()
        public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {
            metrics.addDimension('metricUnit', 'milliseconds');
            // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
            metrics.addMetric('latency', MetricUnits.Milliseconds, 56);
        
            const singleMetric = metrics.singleMetric();
            // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
            singleMetric.addDimension('metricType', 'business');
            singleMetric.addMetric('orderSubmitted', MetricUnits.Count, 1);
        }
    }
    ```
