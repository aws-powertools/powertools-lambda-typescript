---
title: REST API
description: Event handler for building REST APIs in AWS Lambda
status: new
---

!!! warning "Feature status"
     This feature is under active development and may undergo significant changes. We recommend using it in non-critical workloads and [providing feedback](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose) to help us improve it.

Event handler for Amazon API Gateway REST and HTTP APIs, Application Loader Balancer (ALB), Lambda Function URLs, and VPC Lattice.

## Key Features

* Lightweight routing to reduce boilerplate for API Gateway REST/HTTP API, ALB and Lambda Function URLs.
* Built-in middleware engine for request/response transformation and validation.
* Works with micro function (one or a few routes) and monolithic functions (all routes)

## Getting started

### Install

!!! info "This is not necessary if you're installing Powertools for AWS Lambda (TypeScript) via [Lambda layer](../../getting-started/lambda-layers.md)."

```shell
npm install @aws-lambda-powertools/event-handler
```

### Required resources

If you're using any API Gateway integration, you must have an existing [API Gateway Proxy integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html){target="_blank"} or [ALB](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/lambda-functions.html){target="_blank"} configured to invoke your Lambda function.

In case of using [VPC Lattice](https://docs.aws.amazon.com/lambda/latest/dg/services-vpc-lattice.html){target="_blank"}, you must have a service network configured to invoke your Lambda function.

This is the sample infrastructure for API Gateway and Lambda Function URLs we are using for the examples in this documentation.

???+ info "There is no additional permissions or dependencies required to use this utility."

=== "API Gateway SAM Template"

    ```yaml title="AWS Serverless Application Model (SAM) example"
    --8<-- "examples/snippets/event-handler/rest/templates/api_gateway.yml"
    ```

=== "Lambda Function URL SAM Template"

    ```yaml title="AWS Serverless Application Model (SAM) example"
    --8<-- "examples/snippets/event-handler/rest/templates/lambda_furl.yml"
    ```

<!-- remove line below while editing this doc & put it back until the doc has reached its first draft -->
<!-- markdownlint-disable MD043 -->