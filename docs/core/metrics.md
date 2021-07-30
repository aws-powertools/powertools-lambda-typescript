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

:construction: WIP :construction:

!!! tip "For more elaborate assertions and comparisons, check out [our functional testing for Metrics utility](https://github.com/awslabs/aws-lambda-powertools-python/blob/develop/tests/functional/test_metrics.py)"
