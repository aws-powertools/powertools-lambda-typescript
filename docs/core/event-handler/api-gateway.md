---
title: REST API
description: Core utility
---

<!-- markdownlint-disable MD013 -->
???+ warning "Don't use in production (yet)"
    This feature is currently under development. As such it's considered not stable and we might make significant breaking changes before going [before its release](https://github.com/aws-powertools/powertools-lambda-typescript/milestone/17){target="_blank"}. You are welcome to [provide feedback](https://github.com/aws-powertools/powertools-lambda-typescript/issues/413){target="_blank"} and [contribute to the project](../../contributing/getting_started.md){target="_blank"}.

Event handler for Amazon API Gateway REST and HTTP APIs, Application Loader Balancer (ALB), Lambda Function URLs, and VPC Lattice.

## Key Features

* Lightweight routing to reduce boilerplate for API Gateway REST/HTTP API, ALB and Lambda Function URLs.
* Support for CORS, binary and Gzip compression, Decimals JSON encoding and bring your own JSON serializer
* Built-in integration with [Parser](../../utilities/parser.md){target="_blank"} for easy payload validation and parsing
* Works with micro function (one or a few routes) and monolithic functions (all routes)

## Getting started

???+ tip
    All examples shared in this documentation are available within the [project repository](https://github.com/aws-powertools/powertools-lambda-typescript/tree/main/examples/snippets/event-handler){target="_blank"}.

### Install

```shell
npm install @aws-lambda-powertools/event-handler
```

### Required resources

If you're using any API Gateway integration, you must have an existing [API Gateway Proxy integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html){target="_blank"} or [ALB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/lambda-functions.html){target="_blank"} configured to invoke your Lambda function.

In case of using [VPC Lattice](https://docs.aws.amazon.com/lambda/latest/dg/services-vpc-lattice.html){target="_blank"}, you must have a service network configured to invoke your Lambda function.

This is the sample infrastructure for API Gateway and Lambda Function URLs we are using for the examples in this documentation.

???+ info "There is no additional permissions or dependencies required to use this utility."

<!-- remove line below while editing this doc & put it back until the doc has reached its first draft -->
<!-- markdownlint-disable MD043 -->
