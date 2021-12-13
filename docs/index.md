---
title: Homepage
description: AWS Lambda Powertools TypeScript
---

A suite of utilities for AWS Lambda functions to ease adopting best practices such as tracing, structured logging, custom metrics, and more.

!!! tip "Looking for a quick read through how the core features are used?"
    Check out [this detailed blog post](https://aws.amazon.com/blogs/opensource/simplifying-serverless-best-practices-with-lambda-powertools/) with a practical example.

## Tenets

This project separates core utilities that will be available in other runtimes vs general utilities that might not be available across all runtimes.

* **AWS Lambda only**. We optimise for AWS Lambda function environments and supported runtimes only. Utilities might work with web frameworks and non-Lambda environments, though they are not officially supported.
* **Eases the adoption of best practices**. The main priority of the utilities is to facilitate best practices adoption, as defined in the AWS Well-Architected Serverless Lens; all other functionality is optional.
* **Keep it lean**. Additional dependencies are carefully considered for security and ease of maintenance, and prevent negatively impacting startup time.
* **We strive for backwards compatibility**. New features and changes should keep backwards compatibility. If a breaking change cannot be avoided, the deprecation and migration process should be clearly defined.
* **We work backwards from the community**. We aim to strike a balance of what would work best for 80% of customers. Emerging practices are considered and discussed via Requests for Comment (RFCs)
* **Progressive**. Utilities are designed to be incrementally adoptable for customers at any stage of their Serverless journey. They follow language idioms and their community’s common practices.

## Install

:construction:

## Features

| Utility | Description
| ------------------------------------------------- | ---------------------------------------------------------------------------------
[Tracer](./core/tracer.md) | Decorators and utilities to trace Lambda function handlers, and both synchronous and asynchronous functions
[Logger](./core/logger.md) | Structured logging made easier, and decorator to enrich structured logging with key Lambda context details
[Metrics](./core/metrics.md) | Custom Metrics created asynchronously via CloudWatch Embedded Metric Format (EMF)

## Environment variables

!!! info
    **Explicit parameters take precedence over environment variables.**

| Environment variable | Description | Utility | Default |
| ------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| **POWERTOOLS_SERVICE_NAME** | Sets service name used for tracing namespace, metrics dimension and structured logging | All | `"service_undefined"` |
| **POWERTOOLS_METRICS_NAMESPACE** | Sets namespace used for metrics | [Metrics](./core/metrics) | `None` |
| **POWERTOOLS_TRACE_DISABLED** | Explicitly disables tracing | [Tracing](./core/tracer) | `false` |
| **POWERTOOLS_TRACER_CAPTURE_RESPONSE** | Captures Lambda or method return as metadata. | [Tracing](./core/tracer) | `true` |
| **POWERTOOLS_TRACER_CAPTURE_ERROR** | Captures Lambda or method exception as metadata. | [Tracing](./core/tracer) | `true` |
| **POWERTOOLS_LOGGER_LOG_EVENT** | Logs incoming event | [Logging](./core/logger) | `false` |
| **POWERTOOLS_LOGGER_SAMPLE_RATE** | Debug log sampling | [Logging](./core/logger) | `0` |
| **POWERTOOLS_LOG_DEDUPLICATION_DISABLED** | Disables log deduplication filter protection to use Pytest Live Log feature | [Logging](./core/logger) | `false` |
| **LOG_LEVEL** | Sets logging level | [Logging](./core/logger) | `INFO` |
