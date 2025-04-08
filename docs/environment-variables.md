---
title: Environment Variables
description: Environment Variables for Powertools for AWS Lambda
---

<!-- markdownlint-disable MD043 -->

You can configure Powertools for AWS Lambda using environment variables. This is useful when you want to set configuration values in your Infrastructure as Code (IaC) templates or when you want to override default values without changing your code.

???+ info
    Explicit parameters in your code take precedence over environment variables

| Environment variable                         | Description                                                                              | Utility                                | Default                                         |
| -------------------------------------------- |------------------------------------------------------------------------------------------| -------------------------------------- |------------------------------------------------|
| **POWERTOOLS_SERVICE_NAME**                  | Set service name used for tracing namespace, metrics dimension and structured logging    | All                                    | `service_undefined`                             |
| **POWERTOOLS_METRICS_NAMESPACE**             | Set namespace used for metrics                                                           | [Metrics](features/metrics.md)         | `default_namespace`                             |
| **POWERTOOLS_METRICS_FUNCTION_NAME**         | Function name used as dimension for the `ColdStart` metric                               | [Metrics](features/metrics.md)         | [See docs](features/metrics.md#setting-function-name) |
| **POWERTOOLS_METRICS_ENABLED**               | Explicitly disables emitting metrics to stdout                                           | [Metrics](features/metrics.md)         | `true`                                          |
| **POWERTOOLS_TRACE_ENABLED**                 | Explicitly disables tracing                                                              | [Tracer](features/tracer.md)           | `true`                                          |
| **POWERTOOLS_TRACER_CAPTURE_RESPONSE**       | Capture Lambda or method return as metadata.                                             | [Tracer](features/tracer.md)           | `true`                                          |
| **POWERTOOLS_TRACER_CAPTURE_ERROR**          | Capture Lambda or method exception as metadata.                                          | [Tracer](features/tracer.md)           | `true`                                          |
| **POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS** | Capture HTTP(s) requests as segments.                                                    | [Tracer](features/tracer.md)           | `true`                                          |
| **POWERTOOLS_LOGGER_LOG_EVENT**              | Log incoming event                                                                       | [Logger](features/logger.md)           | `false`                                         |
| **POWERTOOLS_LOGGER_SAMPLE_RATE**            | Debug log sampling                                                                       | [Logger](features/logger.md)           | `0`                                             |
| **POWERTOOLS_DEV**                           | Pretty-print logs, disable metrics flushing, and disable traces - use for dev only       | See section below                      | `false`                                         |
| **POWERTOOLS_LOG_LEVEL**                     | Sets how verbose Logger should be, from the most verbose to the least verbose (no logs)  | [Logger](features/logger.md)           | `INFO`                                          |
| **POWERTOOLS_PARAMETERS_MAX_AGE**            | Adjust how long values are kept in cache (in seconds)                                    | [Parameters](features/parameters.md)   | `5`                                             |
| **POWERTOOLS_PARAMETERS_SSM_DECRYPT**        | Set whether to decrypt or not values retrieved from AWS Systems Manager Parameters Store | [Parameters](features/parameters.md)   | `false`                                         |
| **POWERTOOLS_IDEMPOTENCY_DISABLED**          | Disable the Idempotency logic without changing your code, useful for testing             | [Idempotency](features/idempotency.md) | `false`                                         |

Each Utility page provides information on example values and allowed values.

## Dev Mode

Whether you're prototyping locally or against a non-production environment, you can use `POWERTOOLS_DEV` to increase verbosity across multiple utilities.

When `POWERTOOLS_DEV` is set to a truthy value (`1`, `true`), it'll have the following effects:

| Utility           | Effect                                                                                                                                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Logger**        | Increase JSON indentation to 4 and uses global `console` to emit logs to ease testing and local debugging when running functions locally. However, Amazon CloudWatch Logs view will degrade as each new line is treated as a new message |
| **Tracer**        | Disables tracing operations in non-Lambda environments. This already happens automatically in the Tracer utility                                                                                                                         |
| **Metrics**       | Disables emitting metrics to stdout. Can be overridden by setting `POWERTOOLS_METRICS_ENABLED` to `true`                                                                                                                                 |
