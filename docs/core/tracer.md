---
title: Tracer
description: Core utility
---

Tracer is an opinionated thin wrapper for [AWS X-Ray SDK for Node.js](https://github.com/aws/aws-xray-sdk-node).

## Key features

* Auto-capturing cold start and service name as annotations, and responses or full exceptions as metadata.
* Automatically tracing HTTP(S) clients and generating segments for each request.
* Supporting tracing functions via decorators, middleware, and manual instrumentation.
* Supporting tracing AWS SDK v2 and v3 via AWS X-Ray SDK for Node.js.
* Auto-disable tracing when not running in the Lambda environment.

<br />

<figure>
  <img src="../../media/tracer_utility_showcase.png" loading="lazy" alt="Screenshot of the Amazon CloudWatch Console showing an example of segments and subsegments generated and with annotations set for the handler" />
  <figcaption>Tracer showcase - Handler Annotations</figcaption>
</figure>

## Getting started

### Installation

Install the library in your project:

```shell
npm install @aws-lambda-powertools/tracer
```

### Usage

The `Tracer` utility must always be instantiated outside of the Lambda handler. In doing this, subsequent invocations processed by the same instance of your function can reuse these resources. This saves cost by reducing function run time. In addition, `Tracer` can track cold start and annotate the traces accordingly.

=== "handler.ts"

    ```typescript hl_lines="1 3"
    import { Tracer } from '@aws-lambda-powertools/tracer';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    export const handler = async (_event, _context): Promise<void> => {
        // ...
    };
    ```

### Utility settings

The library has three optional settings. You can set them as environment variables, or pass them in the constructor:

| Setting                    | Description                                                           | Environment variable                       | Default            | Allowed Values   | Example            | Constructor parameter  |
|----------------------------|-----------------------------------------------------------------------| -------------------------------------------|--------------------|------------------|--------------------|------------------------|
| **Service name**           | Sets an annotation with the **name of the service** across all traces | `POWERTOOLS_SERVICE_NAME`                  | `service_undefined`| Any string       | `serverlessAirline`| `serviceName`          |
| **Tracing enabled**        | Enables or disables tracing.                                          | `POWERTOOLS_TRACE_ENABLED`                 | `true             `| `true` or `false`| `false`            | `enabled`              |
| **Capture HTTPs Requests** | Defines whether HTTPs requests will be traced or not                  | `POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS` | `true`             | `true` or `false`| `false`            | `captureHTTPsRequests` |
| **Capture Response**       | Defines whether functions responses are serialized as metadata        | `POWERTOOLS_TRACER_CAPTURE_RESPONSE`       | `true`             | `true` or `false`| `false`            | `captureResult`        |
| **Capture Errors**         | Defines whether functions errors are serialized as metadata           | `POWERTOOLS_TRACER_CAPTURE_ERROR`          | `true`             | `true` or `false`| `false`            | N/A                    |

!!! note
    Before your use this utility, your AWS Lambda function must have [Active Tracing enabled](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html) as well as [have permissions](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html#services-xray-permissions) to send traces to AWS X-Ray

#### Example using AWS Serverless Application Model (SAM)

The `Tracer` utility is instantiated outside of the Lambda handler. In doing this, the same instance can be used across multiple invocations inside the same execution environment. This allows `Tracer` to be aware of things like whether or not a given invocation had a cold start or not.

=== "handler.ts"

    ```typescript hl_lines="1 4"
    import { Tracer } from '@aws-lambda-powertools/tracer';

    // Tracer parameter fetched from the environment variables (see template.yaml tab)
    const tracer = new Tracer();

    // You can also pass the parameter in the constructor
    // const tracer = new Tracer({
    //     serviceName: 'serverlessAirline'
    // });
    ```

=== "template.yml"

    ```yaml hl_lines="6 9"
    Resources:
      HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs16.x
          Tracing: Active
          Environment:
            Variables:
              POWERTOOLS_SERVICE_NAME: serverlessAirline
    ```

### Lambda handler

You can quickly start by importing the `Tracer` class, initialize it outside the Lambda handler, and instrument your function.

=== "Middy Middleware"

    !!! tip "Using Middy for the first time?"
        You can install Middy by running `npm i @middy/core`.
        Learn more about [its usage and lifecycle in the official Middy documentation](https://middy.js.org/docs/intro/getting-started){target="_blank"}.

    ```typescript hl_lines="1-2 11 13"
    import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
    import middy from '@middy/core'; // (1)

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
        /* ... */
    };

    // Wrap the handler with middy
    export const handler = middy(lambdaHandler)
        // Use the middleware by passing the Tracer instance as a parameter
        .use(captureLambdaHandler(tracer));
    ```

    1. Using Middy for the first time? You can install Middy by running `npm i @middy/core`.
       Learn more about [its usage and lifecycle in the official Middy documentation](https://github.com/middyjs/middy#usage){target="_blank"}.

=== "Decorator"

    !!! info
        Decorators can only be attached to a class declaration, method, accessor, property, or parameter. Therefore, if you prefer to write your handler as a standard function rather than a Class method, use the middleware or the manual instrumentations instead.  
        See the [official TypeScript documentation](https://www.typescriptlang.org/docs/handbook/decorators.html) for more details.

    ```typescript hl_lines="8"
    import { Tracer } from '@aws-lambda-powertools/tracer';
    import { LambdaInterface } from '@aws-lambda-powertools/commons';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    class Lambda implements LambdaInterface {
        // Decorate your handler class method
        @tracer.captureLambdaHandler()
        public async handler(_event: any, _context: any): Promise<void> {
            /* ... */
        }
    }
     
    const handlerClass = new Lambda();
    export const handler = handlerClass.handler.bind(handlerClass); // (1)
    ```

    1. Binding your handler method allows your handler to access `this`.

=== "Manual"

    ```typescript hl_lines="6 8-9 12-13 19 22 26 28"
    import { Tracer } from '@aws-lambda-powertools/tracer';
    
    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    export const handler = async (_event: any, context: any): Promise<unknown> => {
        const segment = tracer.getSegment(); // This is the facade segment (the one that is created by AWS Lambda)
        // Create subsegment for the function & set it as active
        const subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
        tracer.setSegment(subsegment);

        // Annotate the subsegment with the cold start & serviceName
        tracer.annotateColdStart();
        tracer.addServiceNameAnnotation();

        let res;
        try {
            /* ... */
            // Add the response as metadata 
            tracer.addResponseAsMetadata(res, process.env._HANDLER);
        } catch (err) {
            // Add the error as metadata
            tracer.addErrorAsMetadata(err as Error);
            throw err;
        } finally {
            // Close subsegment (the AWS Lambda one is closed automatically)
            subsegment.close();
            // Set back the facade segment as active again
            tracer.setSegment(segment);
        }
    
        return res;
    };
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

    ```typescript hl_lines="6"
    import { Tracer } from '@aws-lambda-powertools/tracer';
    
    const tracer = new Tracer({ serviceName: 'serverlessAirline' });
 
    export const handler = async (_event: any, _context: any): Promise<void> => {
        tracer.putAnnotation('successfulBooking', true);
    };
    ```
=== "Metadata"
    You can add metadata using `putMetadata` method.

    ```typescript hl_lines="7"
    import { Tracer } from '@aws-lambda-powertools/tracer';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    export const handler = async (_event: any, _context: any): Promise<void> => {
        const res; /* ... */
        tracer.putMetadata('paymentResponse', res);
    };
    ```

<figure>
  <img src="../../media/tracer_utility_showcase_2.png" loading="lazy" alt="Screenshot of the Amazon CloudWatch Console showing an example of segments and subsegments generated and with metadata set for the handler"/>
  <figcaption>Tracer showcase - Handler Metadata</figcaption>
</figure>

### Methods

You can trace other Class methods using the `captureMethod` decorator or any arbitrary function using manual instrumentation.

=== "Decorator"

    ```typescript hl_lines="8"
    import { Tracer } from '@aws-lambda-powertools/tracer';
    import { LambdaInterface } from '@aws-lambda-powertools/commons';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    class Lambda implements LambdaInterface {
        // Decorate your class method
        @tracer.captureMethod() // (1)
        public getChargeId(): string {
            /* ... */
            return 'foo bar';
        }

        public async handler(_event: any, _context: any): Promise<void> {
            /* ... */
        }
    }
     
    const handlerClass = new Lambda();
    export const handler = handlerClass.handler.bind(handlerClass); // (2)
    ```

    1. You can set a custom name for the subsegment by passing `subSegmentName` to the decorator, like: `@tracer.captureMethod({ subSegmentName: '### myCustomMethod' })`.
    2. Binding your handler method allows your handler to access `this`.

=== "Manual"

    ```typescript hl_lines="6 8-9 15 18 23 25"
    import { Tracer } from '@aws-lambda-powertools/tracer';
    
    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    const getChargeId = async (): Promise<unknown> => {
        const parentSubsegment = tracer.getSegment(); // This is the subsegment currently active
        // Create subsegment for the function & set it as active
        const subsegment = parentSubsegment.addNewSubsegment(`### chargeId`);
        tracer.setSegment(subsegment);

        let res;
        try {
            /* ... */
            // Add the response as metadata
            tracer.addResponseAsMetadata(res, 'chargeId');
        } catch (err) {
            // Add the error as metadata
            tracer.addErrorAsMetadata(err as Error);
            throw err;
        }

        // Close subsegment (the AWS Lambda one is closed automatically)
        subsegment.close();
        // Set the facade segment as active again
        tracer.setSegment(parentSubsegment);
    
        return res;
    };

    export const handler = async (_event: any, _context: any): Promise<void> => {
        const chargeId = getChargeId();
        const payment = collectPayment(chargeId);
        /* ... */
    };
    ```


### Patching AWS SDK clients

Tracer can patch any [AWS SDK clients](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-awssdkclients.html) and create traces when your application makes calls to AWS services.

!!! info
    The following snippet assumes you are using the [**AWS SDK v3** for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)

You can patch any AWS SDK clients by calling the `captureAWSv3Client` method:

=== "index.ts"

    ```typescript hl_lines="5"
    import { S3Client } from '@aws-sdk/client-s3';
    import { Tracer } from '@aws-lambda-powertools/tracer';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });
    const client = tracer.captureAWSv3Client(new S3Client({}));
    ```

!!! info
    The following two snippets assume you are using the [**AWS SDK v2** for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/welcome.html)

You can patch all AWS SDK v2 clients by calling the `captureAWS` method:

=== "index.ts"

    ```typescript hl_lines="4"
    import { Tracer } from '@aws-lambda-powertools/tracer';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });
    const AWS = tracer.captureAWS(require('aws-sdk'));
    ```

If you're looking to shave a few microseconds, or milliseconds depending on your function memory configuration, you can patch only specific AWS SDK v2 clients using `captureAWSClient`:

=== "index.ts"

    ```typescript hl_lines="5"
    import { S3 } from 'aws-sdk';
    import { Tracer } from '@aws-lambda-powertools/tracer';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });
    const s3 = tracer.captureAWSClient(new S3());
    ```

### Tracing HTTP requests

When your function makes calls to HTTP APIs, Tracer automatically traces those calls and add the API to the service graph as a downstream service.

You can opt-out from this feature by setting the **`POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS=false`** environment variable or by passing the `captureHTTPSRequests: false` option to the `Tracer` constructor.

!!! info
    The following snippet shows how to trace [axios](https://www.npmjs.com/package/axios) requests, but you can use any HTTP client library built on top of [http](https://nodejs.org/api/http.html) or [https](https://nodejs.org/api/https.html).
    Support to 3rd party HTTP clients is provided on a best effort basis.

=== "index.ts"

    ```typescript hl_lines="2 7"
    import { Tracer } from '@aws-lambda-powertools/tracer';
    import axios from 'axios'; // (1)

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    export const handler = async (event: unknown, context: Context): Promise<void> => {
        await axios.get('https://httpbin.org/status/200');
    };
    ```

    1.  You can install the [axios](https://www.npmjs.com/package/axios) package using `npm i axios`
=== "Example Raw X-Ray Trace excerpt"

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

Alternatively, use the `captureResponse: false` option in both `tracer.captureLambdaHandler()` and `tracer.captureMethod()` decorators, or use the same option in the Middy `captureLambdaHander` middleware to instruct Tracer **not** to serialize function responses as metadata.

=== "method.ts"

    ```typescript hl_lines="6"
    import { Tracer } from '@aws-lambda-powertools/tracer';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    class Lambda implements LambdaInterface {
        @tracer.captureMethod({ captureResult: false })
        public getChargeId(): string {
            /* ... */
            return 'foo bar';
        }

        public async handler(_event: any, _context: any): Promise<void> {
            /* ... */
        }
    }

    const handlerClass = new Lambda();
    export const handler = handlerClass.handler.bind(handlerClass);
    ```

=== "handler.ts"

    ```typescript hl_lines="7"
    import { Tracer } from '@aws-lambda-powertools/tracer';
    import { LambdaInterface } from '@aws-lambda-powertools/commons';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    class Lambda implements LambdaInterface {
        @tracer.captureLambdaHandler({ captureResponse: false })
        async handler(_event: any, _context: any): Promise<void> {
            /* ... */
        }
    }

    const handlerClass = new Lambda();
    export const handler = handlerClass.handler.bind(handlerClass);
    ```

=== "middy.ts"

    ```typescript hl_lines="14"
    import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
    import middy from '@middy/core';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });

    const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
        /* ... */
    };

    // Wrap the handler with middy
    export const handler = middy(lambdaHandler)
        // Use the middleware by passing the Tracer instance as a parameter,
        // but specify the captureResponse option as false.
        .use(captureLambdaHandler(tracer, { captureResponse: false }));
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

    ```typescript hl_lines="9"
    import { Tracer } from '@aws-lambda-powertools/tracer';

    const tracer = new Tracer({ serviceName: 'serverlessAirline' });
    
    export const handler = async (event: unknown, context: Context): Promise<void> => {
        try {
        ...
        } catch (err) {
            const rootTraceId = tracer.getRootXrayTraceId();
   
            // Example of returning an error response
            return {
                statusCode: 500,
                body: `Internal Error - Please contact support and quote the following id: ${rootTraceId}`,
                headers: { '_X_AMZN_TRACE_ID': rootTraceId },
            };
        }
    };
    ```

### Escape hatch mechanism

You can use `tracer.provider` attribute to access all methods provided by the [AWS X-Ray SDK](https://docs.aws.amazon.com/xray-sdk-for-nodejs/latest/reference/AWSXRay.html).

This is useful when you need a feature available in X-Ray that is not available in the Tracer utility, for example [SQL queries tracing](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-sqlclients.html), or [a custom logger](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-configuration.html#xray-sdk-nodejs-configuration-logging).

=== "index.ts"

    ```typescript hl_lines="7"
    import { Logger } from '@aws-lambda-powertools/logger';
    import { Tracer } from '@aws-lambda-powertools/tracer';

    const serviceName = 'serverlessAirline';
    const logger = new Logger({ serviceName: serviceName });
    const tracer = new Tracer({ serviceName: serviceName });
    tracer.provider.setLogger(logger);
    ```

## Testing your code

Tracer is disabled by default when not running in the AWS Lambda environment - This means no code changes or environment variables to be set.

## Tips

* Use annotations on key operations to slice and dice traces, create unique views, and create metrics from it via Trace Groups
* Use a namespace when adding metadata to group data more easily
* Annotations and metadata are added to the currently open subsegment. If you want them in a specific subsegment, [create one](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs-subsegments.html#xray-sdk-nodejs-subsegments-lambda) via the escape hatch mechanism
