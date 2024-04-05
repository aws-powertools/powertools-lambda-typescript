---
title: Tracer
description: Core utility
---

Tracer is an opinionated thin wrapper for [AWS X-Ray SDK for Node.js](https://github.com/aws/aws-xray-sdk-node).

## Key features

* Auto-capturing cold start and service name as annotations, and responses or full exceptions as metadata.
* Automatically tracing HTTP(S) clients including `fetch` and generating segments for each request.
* Supporting tracing functions via decorators, middleware, and manual instrumentation.
* Supporting tracing AWS SDK v2 and v3 via AWS X-Ray SDK for Node.js.
* Auto-disable tracing when not running in the Lambda environment.

<br />

<figure>
  <img src="../../media/tracer_utility_showcase.png" loading="lazy" alt="Screenshot of the Amazon CloudWatch Console showing an example of segments and subsegments generated and with annotations set for the handler" />
  <figcaption>Tracer showcase - Handler Annotations</figcaption>
</figure>

## Getting started

!!! note "Tracer relies on AWS X-Ray SDK over [OpenTelemetry Distro (ADOT)](https://aws-otel.github.io/docs/getting-started/lambda){target="_blank"} for optimal cold start (lower latency)."

### Installation

Install the library in your project:

```shell
npm install @aws-lambda-powertools/tracer
```

### Usage

The `Tracer` utility must always be instantiated outside of the Lambda handler. In doing this, subsequent invocations processed by the same instance of your function can reuse these resources. This saves cost by reducing function run time. In addition, `Tracer` can track cold start and annotate the traces accordingly.

=== "handler.ts"

    ```typescript hl_lines="1 3"
    --8<-- "docs/snippets/tracer/basicUsage.ts"
    ```

### Utility settings

The library has three optional settings. You can set them as environment variables, or pass them in the constructor:

| Setting                    | Description                                                           | Environment variable                       | Default             | Allowed Values    | Example             | Constructor parameter  |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------ | ------------------- | ----------------- | ------------------- | ---------------------- |
| **Service name**           | Sets an annotation with the **name of the service** across all traces | `POWERTOOLS_SERVICE_NAME`                  | `service_undefined` | Any string        | `serverlessAirline` | `serviceName`          |
| **Tracing enabled**        | Enables or disables tracing.                                          | `POWERTOOLS_TRACE_ENABLED`                 | `true             ` | `true` or `false` | `false`             | `enabled`              |
| **Capture HTTPs Requests** | Defines whether HTTPs requests will be traced or not                  | `POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS` | `true`              | `true` or `false` | `false`             | `captureHTTPsRequests` |
| **Capture Response**       | Defines whether functions responses are serialized as metadata        | `POWERTOOLS_TRACER_CAPTURE_RESPONSE`       | `true`              | `true` or `false` | `false`             | `captureResult`        |
| **Capture Errors**         | Defines whether functions errors are serialized as metadata           | `POWERTOOLS_TRACER_CAPTURE_ERROR`          | `true`              | `true` or `false` | `false`             | N/A                    |

!!! note
    Before you use this utility, your AWS Lambda function must have [Active Tracing enabled](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html) as well as [have permissions](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html#services-xray-permissions) to send traces to AWS X-Ray

#### Example using AWS Serverless Application Model (SAM)

The `Tracer` utility is instantiated outside of the Lambda handler. In doing this, the same instance can be used across multiple invocations inside the same execution environment. This allows `Tracer` to be aware of things like whether or not a given invocation had a cold start or not.

=== "handler.ts"

    ```typescript hl_lines="1 4"
    --8<-- "docs/snippets/tracer/sam.ts"
    ```

=== "template.yml"

    ```yaml hl_lines="6 9"
    Resources:
      HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs20.x
          Tracing: Active
          Environment:
            Variables:
              POWERTOOLS_SERVICE_NAME: serverlessAirline
    ```

### Lambda handler

You can quickly start by importing the `Tracer` class, initialize it outside the Lambda handler, and instrument your function.

=== "Middy Middleware"

    !!! tip "A note about Middy"
        We guarantee support only for Middy.js `v4.x`, that you can install it by running `npm i @middy/core@~4`.
        Check their docs to learn more about [Middy and its middleware stack](https://middy.js.org/docs/intro/getting-started){target="_blank"} as well as [best practices when working with Powertools](https://middy.js.org/docs/integrations/lambda-powertools#best-practices){target="_blank"}.

    ```typescript hl_lines="2 15 17"
    --8<-- "docs/snippets/tracer/middy.ts"
    ```

=== "Decorator"

    !!! note
        The class method decorators in this project follow the experimental implementation enabled via the [`experimentalDecorators` compiler option](https://www.typescriptlang.org/tsconfig#experimentalDecorators) in TypeScript. Additionally, they are implemented in a way that fits asynchronous methods. When decorating a synchronous method, the decorator replaces its implementation with an asynchronous one causing the caller to have to `await` the now decorated method.
        If this is not the desired behavior, you can use one of the other patterns instead.

    ```typescript hl_lines="8"
    --8<-- "docs/snippets/tracer/decorator.ts"
    ```

    1. Binding your handler method allows your handler to access `this`.

=== "Manual"

    ```typescript hl_lines="9-15 18-19 23 26 29-34"
    --8<-- "docs/snippets/tracer/manual.ts"
    ```


When using the `captureLambdaHandler` decorator or middleware, Tracer performs these additional tasks to ease operations:

* Handles the lifecycle of the subsegment
* Creates a `ColdStart` annotation to easily filter traces that have had an initialization overhead
* Creates a `Service` annotation to easily filter traces that have a specific service name
* Captures any response, or full exceptions generated by the handler, and include them as tracing metadata

### Annotations & Metadata

**Annotations** are key-values associated with traces and indexed by AWS X-Ray. You can use them to filter traces and to create [Trace Groups](https://aws.amazon.com/about-aws/whats-new/2018/11/aws-xray-adds-the-ability-to-group-traces/) to slice and dice your transactions.

**Metadata** are key-values also associated with traces but not indexed by AWS X-Ray. You can use them to add additional context for an operation using any native object.

=== "Annotations"
    You can add annotations using `putAnnotation` method.

    ```typescript hl_lines="12"
    --8<-- "docs/snippets/tracer/putAnnotation.ts"
    ```

    1. When Lambda starts an invocation [the X-Ray SDk creates a segment called `facade`](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-subsegments.html#xray-sdk-nodejs-subsegments-lambda). This segment cannot be annotated or modified by your code, so you need to create a new subsegment. This is done automatically by Tracer when using the [decorator or middleware patterns](./tracer.md/#lambda-handler)
    2. To correctly trace the current and subsequent invocations you need to restore the original segment, this is done automatically by Tracer when using the [decorator or middleware patterns](./tracer.md/#lambda-handler).
=== "Metadata"
    You can add metadata using `putMetadata` method.

    ```typescript hl_lines="12-14"
    --8<-- "docs/snippets/tracer/putMetadata.ts"
    ```

    1. When Lambda starts an invocation [the X-Ray SDk creates a segment called `facade`](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-subsegments.html#xray-sdk-nodejs-subsegments-lambda). This segment cannot be modified by your code, so you need to create a new subsegment. This is done automatically by Tracer when using the [decorator or middleware patterns](./tracer.md/#lambda-handler)
    2. To correctly trace the current and subsequent invocations you need to restore the original segment, this is done automatically by Tracer when using the [decorator or middleware patterns](./tracer.md/#lambda-handler).

<figure>
  <img src="../../media/tracer_utility_showcase_2.png" loading="lazy" alt="Screenshot of the Amazon CloudWatch Console showing an example of segments and subsegments generated and with metadata set for the handler"/>
  <figcaption>Tracer showcase - Handler Metadata</figcaption>
</figure>

### Methods

You can trace other class methods using the `captureMethod` decorator or any arbitrary asynchronous function using manual instrumentation.

=== "Decorator"

    !!! note
        The class method decorators in this project follow the experimental implementation enabled via the [`experimentalDecorators` compiler option](https://www.typescriptlang.org/tsconfig#experimentalDecorators) in TypeScript. Additionally, they are implemented in a way that fits asynchronous methods. When decorating a synchronous method, the decorator replaces its implementation with an asynchronous one causing the caller to have to `await` the now decorated method.
        If this is not the desired behavior, you can use manual instrumentation instead.

    ```typescript hl_lines="8"
    --8<-- "docs/snippets/tracer/captureMethodDecorator.ts"
    ```

    1. You can set a custom name for the subsegment by passing `subSegmentName` to the decorator, like: `@tracer.captureMethod({ subSegmentName: '### myCustomMethod' })`.
    2. Binding your handler method allows your handler to access `this`.

=== "Manual"

    ```typescript hl_lines="6-12 18 21 25-30"
    --8<-- "docs/snippets/tracer/captureMethodManual.ts"
    ```


### Patching AWS SDK clients

Tracer can patch any [AWS SDK clients](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-awssdkclients.html) and create traces when your application makes calls to AWS services.

!!! info
    The following snippet assumes you are using the [**AWS SDK v3** for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

You can patch any AWS SDK clients by calling the `captureAWSv3Client` method:

=== "index.ts"

    ```typescript hl_lines="6"
    --8<-- "docs/snippets/tracer/captureAWSv3.ts"
    ```

!!! info
    The following two snippets assume you are using the [**AWS SDK v2** for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/welcome.html)

You can patch all AWS SDK v2 clients by calling the `captureAWS` method:

=== "index.ts"

    ```typescript hl_lines="7"
    --8<-- "docs/snippets/tracer/captureAWSAll.ts"
    ```

If you're looking to shave a few microseconds, or milliseconds depending on your function memory configuration, you can patch only specific AWS SDK v2 clients using `captureAWSClient`:

=== "index.ts"

    ```typescript hl_lines="6"
    --8<-- "docs/snippets/tracer/captureAWS.ts"
    ```

### Tracing HTTP requests

When your function makes outgoing requests to APIs, Tracer automatically traces those calls and adds the API to the service graph as a downstream service.

You can opt-out from this feature by setting the **`POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS=false`** environment variable or by passing the `captureHTTPSRequests: false` option to the `Tracer` constructor.

!!! info
    The following snippet shows how to trace [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) requests, but you can use any HTTP client library built on top it, or on [http](https://nodejs.org/api/http.html), and [https](https://nodejs.org/api/https.html).
    Support to 3rd party HTTP clients is provided on a best effort basis.

=== "index.ts"

    ```typescript hl_lines="2"
    --8<-- "docs/snippets/tracer/captureHTTP.ts"
    ```

    ```json hl_lines="6 9 12-21"
    {
        "id": "22883fbc730e3a0b",
        "name": "## index.handler",
        "start_time": 1647956168.22749,
        "end_time": 1647956169.0679862,
        "subsegments": [
            {
                "id": "ab82ab2b7d525d8f",
                "name": "httpbin.org",
                "start_time": 1647956168.407,
                "end_time": 1647956168.945,
                "http": {
                    "request": {
                        "url": "https://httpbin.org/status/200",
                        "method": "GET"
                    },
                    "response": {
                        "status": 200,
                        "content_length": 0
                    }
                },
                "namespace": "remote"
            }
        ]
    }
    ```

## Advanced

### Disabling response auto-capture

Use **`POWERTOOLS_TRACER_CAPTURE_RESPONSE=false`** environment variable to instruct Tracer **not** to serialize function responses as metadata.

!!! info "This is commonly useful in three scenarios"

    1. You might **return sensitive** information you don't want it to be added to your traces
    2. You might manipulate **streaming objects that can be read only once**; this prevents subsequent calls from being empty
    3. You might return **more than 64K** of data _e.g., `message too long` error_

Alternatively, use the `captureResponse: false` option in both `tracer.captureLambdaHandler()` and `tracer.captureMethod()` decorators, or use the same option in the Middy `captureLambdaHandler` middleware to instruct Tracer **not** to serialize function responses as metadata.

=== "method.ts"

    ```typescript hl_lines="7"
    --8<-- "docs/snippets/tracer/disableCaptureResponseMethod.ts"
    ```

=== "handler.ts"

    ```typescript hl_lines="7"
    --8<-- "docs/snippets/tracer/disableCaptureResponseHandler.ts"
    ```

=== "middy.ts"

    ```typescript hl_lines="18"
    --8<-- "docs/snippets/tracer/disableCaptureResponseMiddy.ts"
    ```

### Disabling errors auto-capture

Use **`POWERTOOLS_TRACER_CAPTURE_ERROR=false`** environment variable to instruct Tracer **not** to serialize errors as metadata.

!!! info "Commonly useful in one scenario"

    1. You might **return sensitive** information from errors, stack traces you might not control

### Access AWS X-Ray Root Trace ID

Tracer exposes a `getRootXrayTraceId()` method that allows you to retrieve the [AWS X-Ray Root Trace ID](https://docs.aws.amazon.com/xray/latest/devguide/xray-concepts.html#xray-concepts-traces) corresponds to the current function execution.

!!! info "This is commonly useful in two scenarios"

    1. By including the root trace id in your response, consumers can use it to correlate requests
    2. You might want to surface the root trace id to your end users so that they can reference it while contacting customer service

=== "index.ts"

    ```typescript hl_lines="11"
    --8<-- "docs/snippets/tracer/accessRootTraceId.ts"
    ```

### Escape hatch mechanism

You can use `tracer.provider` attribute to access all methods provided by the [AWS X-Ray SDK](https://docs.aws.amazon.com/xray-sdk-for-nodejs/latest/reference/AWSXRay.html).

This is useful when you need a feature available in X-Ray that is not available in the Tracer utility, for example [SQL queries tracing](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-sqlclients.html), or [a custom logger](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-configuration.html#xray-sdk-nodejs-configuration-logging).

=== "index.ts"

    ```typescript hl_lines="7"
    --8<-- "docs/snippets/tracer/escapeHatch.ts"
    ```

## Testing your code

Tracer is disabled by default when not running in the AWS Lambda environment - This means no code changes or environment variables to be set.

## Tips

* Use annotations on key operations to slice and dice traces, create unique views, and create metrics from it via Trace Groups
* Use a namespace when adding metadata to group data more easily
* Annotations and metadata are added to the currently open subsegment. If you want them in a specific subsegment, [create one](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-subsegments.html#xray-sdk-nodejs-subsegments-lambda) via the escape hatch mechanism
