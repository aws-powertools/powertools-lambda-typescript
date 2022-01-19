---
title: Metrics
description: Core utility
---

!!! warning  "Do not use this library in production"

    AWS Lambda Powertools for TypeScript is currently released as a beta developer preview and is intended strictly for feedback purposes only.  
    This version is not stable, and significant breaking changes might incur as part of the upcoming [production-ready release](https://github.com/awslabs/aws-lambda-powertools-typescript/milestone/2){target="_blank"}.

    **Do not use this library for production workloads.**

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

### Installation

Install the library in your project:

```shell
npm install @aws-lambda-powertools/metrics
```

### Utility settings

The library requires two settings. You can set them as environment variables, or pass them in the constructor.  

These settings will be used across all metrics emitted:

Setting | Description | Environment variable | Constructor parameter
------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------
**Metric namespace** | Logical container where all metrics will be placed e.g. `serverlessAirline` |  `POWERTOOLS_METRICS_NAMESPACE` | `namespace`
**Service** | Optionally, sets **service** metric dimension across all metrics e.g. `payment` | `POWERTOOLS_SERVICE_NAME` | `serviceName`

For a **complete list** of supported environment variables, refer to [this section](./../index.md#environment-variables).

!!! tip
    Use your application name or main service as the metric namespace to easily group all metrics

#### Example using AWS Serverless Application Model (SAM)

=== "handler.ts"

    ```typescript hl_lines="1 4"
    import { Metrics } from '@aws-lambda-powertools/metrics';

    // Metrics parameters fetched from the environment variables (see template.yaml tab)
    const metrics = new Metrics();
    
    // You can also pass the parameters in the constructor
    // const metrics = new Metrics({
    //   namespace: 'serverlessAirline',
    //   serviceName: 'orders'
    // });
    ```

=== "template.yml"

    ```yaml hl_lines="9 10"
    Resources:
      HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs14.x
          Environment:
          Variables:
            POWERTOOLS_SERVICE_NAME: orders
            POWERTOOLS_METRICS_NAMESPACE: serverlessAirline
    ```

You can initialize Metrics anywhere in your code - It'll keep track of your aggregate metrics in memory.

### Creating metrics

You can create metrics using the `addMetric` method, and you can create dimensions for all your aggregate metrics using the `addDimension` method.

=== "Metrics"

    ```typescript hl_lines="6"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    export const handler = async (_event: any, _context: any): Promise<void> => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
        metrics.publishStoredMetrics();
    };
    ```

=== "Metrics with custom dimensions"

    ```typescript hl_lines="6-7"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    export const handler = async (_event: any, _context: any): Promise<void> => {
        metrics.addDimension('environment', 'prod');
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
        metrics.publishStoredMetrics();
    };
    ```

!!! tip "Autocomplete Metric Units"
    Use the `MetricUnit` enum to easily find a supported metric unit by CloudWatch. Alternatively, you can pass the value as a string if you already know them e.g. "Count".

!!! note "Metrics overflow"
    CloudWatch EMF supports a max of 100 metrics per batch. Metrics will automatically propagate all the metrics when adding the 100th metric. Subsequent metrics, e.g. 101th, will be aggregated into a new EMF object, for your convenience.

!!! warning "Do not create metrics or dimensions outside the handler"
    Metrics or dimensions added in the global scope will only be added during cold start. Disregard if that's the intended behaviour.

### Adding multi-value metrics

You can call `addMetric()` with the same name multiple times. The values will be grouped together in an array.

=== "addMetric() with the same name"

    ```typescript hl_lines="8 10"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { Context } from 'aws-lambda'; 

    const metrics = new Metrics({ namespace:'serverlessAirline', serviceName:'orders' });

    export const handler = async (event: any, context: Context): Promise<void> => {
        metrics.addMetric('performedActionA', MetricUnits.Count, 2);
        // do something else...
        metrics.addMetric('performedActionA', MetricUnits.Count, 1);
    };
    ```
=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="2-5 18-19"
    {
        "performedActionA": [
            2,
            1
        ],
        "_aws": {
            "Timestamp": 1592234975665,
            "CloudWatchMetrics": [
                {
                "Namespace": "serverlessAirline",
                "Dimensions": [
                    [
                    "service"
                    ]
                ],
                "Metrics": [
                    {
                    "Name": "performedActionA",
                    "Unit": "Count"
                    }
                ]
                }
            ]
        },
        "service": "orders"
    }
    ```

### Adding default dimensions

You can add default dimensions to your metrics by passing them as parameters in 4 ways:  

* in the constructor
* in the [Middy-compatible](https://github.com/middyjs/middy){target=_blank} middleware
* using the `setDefaultDimensions` method
* in the decorator

=== "constructor"

    ```typescript hl_lines="6"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

    const metrics = new Metrics({
        namespace: 'serverlessAirline', 
        serviceName: 'orders', 
        defaultDimensions: { 'environment': 'prod', 'foo': 'bar' } 
    });

    export const handler = async (_event: any, _context: any): Promise<void> => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    };
    ```

=== "Middy middleware"

    !!! note
        Middy comes bundled with Metrics, so you can just import it when using the middleware.

    !!! tip "Using Middy for the first time?"
        Learn more about [its usage and lifecycle in the official Middy documentation](https://github.com/middyjs/middy#usage){target="_blank"}.

    ```typescript hl_lines="1-2 11 13"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import middy from '@middy/core';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    };

    // Wrap the handler with middy
    export const handler = middy(lambdaHandler)
        // Use the middleware by passing the Metrics instance as a parameter
        .use(logMetrics(metrics, { defaultDimensions:{ 'environment': 'prod', 'foo': 'bar' } }));
    ```

=== "setDefaultDimensions method"

    ```typescript hl_lines="4"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
    metrics.setDefaultDimensions({ 'environment': 'prod', 'foo': 'bar' });

    export const handler = async (event: any, _context: any): Promise<void> => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    };
    ```

=== "with logMetrics decorator"

    ```typescript hl_lines="9"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { LambdaInterface } from '@aws-lambda-powertools/commons';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });
    const DEFAULT_DIMENSIONS = { 'environment': 'prod', 'foo': 'bar' };

    export class MyFunction implements LambdaInterface {
        // Decorate your handler class method
        @metrics.logMetrics({ defaultDimensions: DEFAULT_DIMENSIONS })
        public async handler(_event: any, _context: any): Promise<void> {
            metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
        }
    }
    ```

If you'd like to remove them at some point, you can use the `clearDefaultDimensions` method.

### Flushing metrics

As you finish adding all your metrics, you need to serialize and "flush them" by calling `publishStoredMetrics()`. This will print the metrics to standard output.

You can flush metrics automatically using one of the following methods:  

* manually
* [Middy-compatible](https://github.com/middyjs/middy){target=_blank} middleware
* class decorator

Using the Middy middleware or decorator will **automatically validate, serialize, and flush** all your metrics. During metrics validation, if no metrics are provided then a warning will be logged, but no exception will be thrown.
If you do not use the middleware or decorator, you have to flush your metrics manually.

!!! warning "Metric validation"
    If metrics are provided, and any of the following criteria are not met, a **`RangeError`** exception will be thrown:

    * Maximum of 9 dimensions
    * Namespace is set only once (or none)
    * Metric units must be [supported by CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_MetricDatum.html)

#### Manually

You can manually flush the metrics with `publishStoredMetrics` as follows:

!!! warning
    Metrics, dimensions and namespace validation still applies.

=== "handler.ts"

    ```typescript hl_lines="7"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    export const handler = async (_event: any, _context: any): Promise<void> => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 10);
        metrics.publishStoredMetrics();
    };
    ```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="2 7 10 15 22"
    {
        "successfulBooking": 1.0,
        "_aws": {
        "Timestamp": 1592234975665,
        "CloudWatchMetrics": [
            {
            "Namespace": "successfulBooking",
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
        "service": "orders"
    }
    ```

#### Middy middleware

See below an example of how to automatically flush metrics with the Middy-compatible `logMetrics` middleware.

=== "handler.ts"

    ```typescript hl_lines="1-2 7 10-11"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import middy from '@middy/core';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    };

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics));
    ```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="2 7 10 15 22"
    {
        "successfulBooking": 1.0,
        "_aws": {
        "Timestamp": 1592234975665,
        "CloudWatchMetrics": [
            {
            "Namespace": "serverlessAirline",
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
        },
        "service": "orders"
    }
    ```

#### Using the class decorator

!!! info
    Decorators can only be attached to a class declaration, method, accessor, property, or parameter. Therefore, if you prefer to write your handler as a standard function rather than a Class method, check the [middleware](#using-a-middleware) or [manual](#manually) method sections instead.  
    See the [official TypeScript documentation](https://www.typescriptlang.org/docs/handbook/decorators.html) for more details.

The `logMetrics` decorator of the metrics utility can be used when your Lambda handler function is implemented as method of a Class.

=== "handler.ts"

    ```typescript hl_lines="8"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { LambdaInterface } from '@aws-lambda-powertools/commons';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    export class MyFunction implements LambdaInterface {

        @metrics.logMetrics()
        public async handler(_event: any, _context: any): Promise<void> {
            metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
        }
    }
    ```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="2 7 10 15 22"
    {
        "successfulBooking": 1.0,
        "_aws": {
        "Timestamp": 1592234975665,
        "CloudWatchMetrics": [
            {
            "Namespace": "successfulBooking",
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
        },
        "service": "orders"
    }
    ```

#### Throwing a RangeError when no metrics are emitted

If you want to ensure that at least one metric is emitted before you flush them, you can use the `throwOnEmptyMetrics` parameter and pass it to the middleware or decorator:

=== "handler.ts"

    ```typescript hl_lines="11"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import middy from '@middy/core';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    };

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics, { throwOnEmptyMetrics: true }));
    ```

### Capturing a cold start invocation as metric

You can optionally capture cold start metrics with the `logMetrics` middleware or decorator via the `captureColdStartMetric` param.

=== "Middy Middleware"

    ```typescript hl_lines="11"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import middy from '@middy/core';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
        metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
    };

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics, { captureColdStartMetric: true }));
    ```

=== "logMetrics decorator"

    ```typescript hl_lines="8"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { LambdaInterface } from '@aws-lambda-powertools/commons';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    export class MyFunction implements LambdaInterface {

        @metrics.logMetrics({ captureColdStartMetric: true })
        public async handler(_event: any, _context: any): Promise<void> {
            metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
        }
    }
    ```

If it's a cold start invocation, this feature will:

* Create a separate EMF blob solely containing a metric named `ColdStart`
* Add the `function_name`, `service` and default dimensions

This has the advantage of keeping cold start metric separate from your application metrics, where you might have unrelated dimensions.

!!! info "We do not emit 0 as a value for the ColdStart metric for cost-efficiency reasons. [Let us know](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/new?assignees=&labels=feature-request%2C+triage&template=feature_request.md&title=) if you'd prefer a flag to override it."

## Advanced

### Adding metadata

You can add high-cardinality data as part of your Metrics log with the `addMetadata` method. This is useful when you want to search highly contextual information along with your metrics in your logs.

!!! warning
    **This will not be available during metrics visualization** - Use **dimensions** for this purpose

=== "handler.ts"

    ```typescript hl_lines="8"
        import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
        import middy from '@middy/core';

        const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

        const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
            metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
            metrics.addMetadata('bookingId', '7051cd10-6283-11ec-90d6-0242ac120003');
        };

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
            "Namespace": "serverlessAirline",
            "Dimensions": [
                [
                "service"
                ]
            ],
            "Metrics": [
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
        "service": "orders",
        "bookingId": "7051cd10-6283-11ec-90d6-0242ac120003"
    }
    ```

### Single metric with different dimensions

CloudWatch EMF uses the same dimensions across all your metrics. Use `singleMetric` if you have a metric that should have different dimensions.

!!! info
    For cost-efficiency, this feature would be used sparsely since you [pay for unique metric](https://aws.amazon.com/cloudwatch/pricing). Keep the following formula in mind:

    **unique metric = (metric_name + dimension_name + dimension_value)**

=== "Middy Middleware"

    ```typescript hl_lines="11 13-14"
    import { Metrics, MetricUnits, logMetrics } from '@aws-lambda-powertools/metrics';
    import middy from '@middy/core';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
        metrics.addDimension('metricUnit', 'milliseconds');
        // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
        metrics.addMetric('latency', MetricUnits.Milliseconds, 56);
    
        const singleMetric = metrics.singleMetric();
        // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
        singleMetric.addDimension('metricType', 'business');
        singleMetric.addMetric('orderSubmitted', MetricUnits.Count, 1);
    };

    export const handler = middy(lambdaHandler)
        .use(logMetrics(metrics));
    ```

=== "logMetrics decorator"

    ```typescript hl_lines="14 16-17"
    import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
    import { LambdaInterface } from '@aws-lambda-powertools/commons';

    const metrics = new Metrics({ namespace: 'serverlessAirline', serviceName: 'orders' });

    class Lambda implements LambdaInterface {

        @metrics.logMetrics()
        public async handler(_event: any, _context: any): Promise<void> {
            metrics.addDimension('metricUnit', 'milliseconds');
            // This metric will have the "metricUnit" dimension, and no "metricType" dimension:
            metrics.addMetric('latency', MetricUnits.Milliseconds, 56);
        
            const singleMetric = metrics.singleMetric();
            // This metric will have the "metricType" dimension, and no "metricUnit" dimension:
            singleMetric.addDimension('metricType', 'business');
            singleMetric.addMetric('orderSubmitted', MetricUnits.Count, 1);
        }
    }

    export const myFunction = new Lambda();
    export const handler = myFunction.handler;
    ```
