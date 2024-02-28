---
title: Metrics
description: Core utility
---

Metrics creates custom metrics asynchronously by logging metrics to standard output following [Amazon CloudWatch Embedded Metric Format (EMF)](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Embedded_Metric_Format.html).

These metrics can be visualized through [Amazon CloudWatch Console](https://console.aws.amazon.com/cloudwatch/).

## Key features

* Aggregating up to 100 metrics using a single CloudWatch EMF object (large JSON blob).
* Validating your metrics against common metric definitions mistakes (for example, metric unit, values, max dimensions, max metrics).
* Metrics are created asynchronously by the CloudWatch service. You do not need any custom stacks, and there is no impact to Lambda function latency.
* Creating a one-off metric with different dimensions.

<br />

<figure>
  <img src="../../media/metrics_utility_showcase.png" loading="lazy" alt="Screenshot of the Amazon CloudWatch Console showing an example of business metrics in the Metrics Explorer" />
  <figcaption>Metrics showcase - Metrics Explorer</figcaption>
</figure>

## Terminologies

If you're new to Amazon CloudWatch, there are two terminologies you must be aware of before using this utility:

* **Namespace**. It's the highest level container that will group multiple metrics from multiple services for a given application, for example `ServerlessEcommerce`.
* **Dimensions**. Metrics metadata in key-value format. They help you slice and dice metrics visualization, for example `ColdStart` metric by Payment `service`.
* **Metric**. It's the name of the metric, for example: SuccessfulBooking or UpdatedBooking.
* **Unit**. It's a value representing the unit of measure for the corresponding metric, for example: Count or Seconds.
* **Resolution**. It's a value representing the storage resolution for the corresponding metric. Metrics can be either Standard or High resolution. Read more [here](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Resolution_definition).

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

!!! warning "Caution"
    
    Using the Lambda [Advanced Logging Controls](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-cloudwatchlogs.html#monitoring-cloudwatchlogs-advanced) feature requires you to update your version of Powertools for AWS Lambda (TypeScript) to at least v1.15.0 to ensure metrics are reported correctly to Amazon CloudWatch Metrics.

### Usage

The `Metrics` utility must always be instantiated outside of the Lambda handler. In doing this, subsequent invocations processed by the same instance of your function can reuse these resources. This saves cost by reducing function run time. In addition, `Metrics` can track cold start and emit the appropriate metrics.

=== "handler.ts"

    ```typescript hl_lines="1 3-6"
    --8<-- "docs/snippets/metrics/basicUsage.ts"
    ```

### Utility settings

The library requires two settings. You can set them as environment variables, or pass them in the constructor.  

These settings will be used across all metrics emitted:

| Setting              | Description                                                      | Environment variable           | Default             | Allowed Values | Example             | Constructor parameter |
| -------------------- | ---------------------------------------------------------------- | ------------------------------ | ------------------- | -------------- | ------------------- | --------------------- |
| **Service**          | Optionally, sets **service** metric dimension across all metrics | `POWERTOOLS_SERVICE_NAME`      | `service_undefined` | Any string     | `serverlessAirline` | `serviceName`         |
| **Metric namespace** | Logical container where all metrics will be placed               | `POWERTOOLS_METRICS_NAMESPACE` | `default_namespace` | Any string     | `serverlessAirline` | `default_namespace`   |

!!! tip
    Use your application name or main service as the metric namespace to easily group all metrics

#### Example using AWS Serverless Application Model (SAM)

The `Metrics` utility is instantiated outside of the Lambda handler. In doing this, the same instance can be used across multiple invocations inside the same execution environment. This allows `Metrics` to be aware of things like whether or not a given invocation had a cold start or not.

=== "handler.ts"

    ```typescript hl_lines="1 4"
    --8<-- "docs/snippets/metrics/sam.ts"
    ```

=== "template.yml"

    ```yaml hl_lines="9 10"
    Resources:
      HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs20.x
          Environment:
          Variables:
            POWERTOOLS_SERVICE_NAME: orders
            POWERTOOLS_METRICS_NAMESPACE: serverlessAirline
    ```

You can initialize Metrics anywhere in your code - It'll keep track of your aggregate metrics in memory.

### Creating metrics

You can create metrics using the `addMetric` method, and you can create dimensions for all your aggregate metrics using the `addDimension` method.

=== "Metrics"

    ```typescript hl_lines="12"
    --8<-- "docs/snippets/metrics/createMetrics.ts"
    ```

=== "Metrics with custom dimensions"

    ```typescript hl_lines="12-13"
    --8<-- "docs/snippets/metrics/customDimensions.ts"
    ```

!!! tip "Autocomplete Metric Units"
    Use the `MetricUnit` enum to easily find a supported metric unit by CloudWatch. Alternatively, you can pass the value as a string if you already know them e.g. "Count".

!!! note "Metrics overflow"
    CloudWatch EMF supports a max of 100 metrics per batch. Metrics will automatically propagate all the metrics when adding the 100th metric. Subsequent metrics, e.g. 101th, will be aggregated into a new EMF object, for your convenience.

!!! warning "Do not create metrics or dimensions outside the handler"
    Metrics or dimensions added in the global scope will only be added during cold start. Disregard if that's the intended behavior.

### Adding high-resolution metrics

You can create [high-resolution metrics](https://aws.amazon.com/about-aws/whats-new/2023/02/amazon-cloudwatch-high-resolution-metric-extraction-structured-logs/) passing `resolution` as parameter to `addMetric`. 

!!! tip "When is it useful?"
    High-resolution metrics are data with a granularity of one second and are very useful in several situations such as telemetry, time series, real-time incident management, and others.

=== "Metrics with high resolution"

    ```typescript hl_lines="4 20"
    --8<-- "docs/snippets/metrics/addHighResolutionMetric.ts"
    ```

!!! tip "Autocomplete Metric Resolutions"
    Use the `MetricResolution` type to easily find a supported metric resolution by CloudWatch. Alternatively, you can pass the allowed values of 1 or 60 as an integer.

### Adding multi-value metrics

You can call `addMetric()` with the same name multiple times. The values will be grouped together in an array.

=== "addMetric() with the same name"

    ```typescript hl_lines="12 14"
    --8<-- "docs/snippets/metrics/multiValueMetrics.ts"
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
    --8<-- "docs/snippets/metrics/defaultDimensions.ts"
    ```

=== "Middy middleware"

    !!! tip "A note about Middy"
        Currently we support only Middy `v3.x` that you can install it by running `npm i @middy/core@~3`.
        Check their docs to learn more about [Middy and its middleware stack](https://middy.js.org/docs/intro/getting-started){target="_blank"} as well as [best practices when working with Powertools](https://middy.js.org/docs/integrations/lambda-powertools#best-practices){target="_blank"}.

    ```typescript hl_lines="24-26"
    --8<-- "docs/snippets/metrics/defaultDimensionsMiddy.ts"
    ```

=== "setDefaultDimensions method"

    ```typescript hl_lines="7"
    --8<-- "docs/snippets/metrics/setDefaultDimensions.ts"
    ```

=== "with logMetrics decorator"

    !!! note
        The class method decorators in this project follow the experimental implementation enabled via the [`experimentalDecorators` compiler option](https://www.typescriptlang.org/tsconfig#experimentalDecorators) in TypeScript. Additionally, they are implemented in a way that fits asynchronous methods. When decorating a synchronous method, the decorator replaces its implementation with an asynchronous one causing the caller to have to `await` the now decorated method.
        If this is not the desired behavior, you can use the `logMetrics` middleware instead.

    ```typescript hl_lines="12"
    --8<-- "docs/snippets/metrics/defaultDimensionsDecorator.ts"
    ```

    1. Binding your handler method allows your handler to access `this` within the class methods.

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
    If metrics are provided, and any of the following criteria are not met, a **`RangeError`** error will be thrown:

    * Maximum of 29 dimensions
    * Namespace is set only once (or none)
    * Metric units must be [supported by CloudWatch](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_MetricDatum.html)

#### Middy middleware

See below an example of how to automatically flush metrics with the Middy-compatible `logMetrics` middleware.

=== "handler.ts"

    ```typescript hl_lines="2 17"
    --8<-- "docs/snippets/metrics/middy.ts"
    ```

=== "Example CloudWatch Logs excerpt"

    ```json
    {
        "successfulBooking": 1.0,
        "_aws": {
            "Timestamp": 1592234975665,
            "CloudWatchMetrics": [{
                "Namespace": "serverlessAirline",
                "Dimensions": [
                    [ "service" ]
                ],
                "Metrics": [{
                    "Name": "successfulBooking",
                    "Unit": "Count"
                }]
            }]
        },
        "service": "orders"
    }
    ```

#### Using the class decorator

!!! note
    The class method decorators in this project follow the experimental implementation enabled via the [`experimentalDecorators` compiler option](https://www.typescriptlang.org/tsconfig#experimentalDecorators) in TypeScript. Additionally, they are implemented in a way that fits asynchronous methods. When decorating a synchronous method, the decorator replaces its implementation with an asynchronous one causing the caller to have to `await` the now decorated method.
    If this is not the desired behavior, you can use the `logMetrics` middleware instead.

The `logMetrics` decorator of the metrics utility can be used when your Lambda handler function is implemented as method of a Class.

=== "handler.ts"

    ```typescript hl_lines="10"
    --8<-- "docs/snippets/metrics/decorator.ts"
    ```

    1. Binding your handler method allows your handler to access `this` within the class methods.

=== "Example CloudWatch Logs excerpt"

    ```json
    {
        "successfulBooking": 1.0,
        "_aws": {
            "Timestamp": 1592234975665,
            "CloudWatchMetrics": [{
                "Namespace": "successfulBooking",
                "Dimensions": [
                    [ "service" ]
                ],
                "Metrics": [{
                    "Name": "successfulBooking",
                    "Unit": "Count"
                }]
            }]
        },
        "service": "orders"
    }
    ```

#### Manually

You can manually flush the metrics with `publishStoredMetrics` as follows:

!!! warning
    Metrics, dimensions and namespace validation still applies.

=== "handler.ts"

    ```typescript hl_lines="13"
    --8<-- "docs/snippets/metrics/manual.ts"
    ```

=== "Example CloudWatch Logs excerpt"

    ```json
    {
        "successfulBooking": 1.0,
        "_aws": {
            "Timestamp": 1592234975665,
            "CloudWatchMetrics": [{
                "Namespace": "successfulBooking",
                "Dimensions": [
                    [ "service" ]
                ],
                "Metrics": [{
                    "Name": "successfulBooking",
                    "Unit": "Count"
                }]
            }]
        },
        "service": "orders"
    }
    ```

#### Throwing a RangeError when no metrics are emitted

If you want to ensure that at least one metric is emitted before you flush them, you can use the `throwOnEmptyMetrics` parameter and pass it to the middleware or decorator:

=== "handler.ts"

    ```typescript hl_lines="21"
    --8<-- "docs/snippets/metrics/throwOnEmptyMetrics.ts"
    ```

### Capturing a cold start invocation as metric

You can optionally capture cold start metrics with the `logMetrics` middleware or decorator via the `captureColdStartMetric` param.

=== "Middy Middleware"

    ```typescript hl_lines="18"
    --8<-- "docs/snippets/metrics/captureColdStartMetricMiddy.ts"
    ```

=== "logMetrics decorator"

    ```typescript hl_lines="10"
    --8<-- "docs/snippets/metrics/captureColdStartMetricDecorator.ts"
    ```

If it's a cold start invocation, this feature will:

* Create a separate EMF blob solely containing a metric named `ColdStart`
* Add the `function_name`, `service` and default dimensions

This has the advantage of keeping cold start metric separate from your application metrics, where you might have unrelated dimensions.

!!! info "We do not emit 0 as a value for the ColdStart metric for cost-efficiency reasons. [Let us know](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=feature-request%2C+triage&template=feature_request.md&title=) if you'd prefer a flag to override it."

## Advanced

### Adding metadata

You can add high-cardinality data as part of your Metrics log with the `addMetadata` method. This is useful when you want to search highly contextual information along with your metrics in your logs.

!!! warning
    **This will not be available during metrics visualization** - Use **dimensions** for this purpose

=== "handler.ts"

    ```typescript hl_lines="15"
    --8<-- "docs/snippets/metrics/addMetadata.ts"
    ```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="31"
    {
        "successfulBooking": 1.0,
        "_aws": {
            "Timestamp": 1592234975665,
            "CloudWatchMetrics": [{
                "Namespace": "serverlessAirline",
                "Dimensions": [
                    [ "service" ]
                ],
                "Metrics": [{
                    "Namespace": "exampleApplication",
                    "Dimensions": [
                        [ "service" ]
                    ],
                    "Metrics": [{
                        "Name": "successfulBooking",
                        "Unit": "Count"
                    }]
                }]
            }]
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

    ```typescript hl_lines="21 23-24"
    --8<-- "docs/snippets/metrics/singleMetricDifferentDimsMiddy.ts"
    ```

=== "logMetrics decorator"

    ```typescript hl_lines="16 18-19"
    --8<-- "docs/snippets/metrics/singleMetricDifferentDimsDecorator.ts"
    ```

    1. Binding your handler method allows your handler to access `this` within the class methods.
