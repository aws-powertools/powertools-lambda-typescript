---
title: Logger
description: Core utility
---

!!! warning  "Do not use this library in production"

    AWS Lambda Powertools for TypeScript is currently released as a beta developer preview and is intended strictly for feedback purposes only.  
    This version is not stable, and significant breaking changes might incur as part of the upcoming [production-ready release](https://github.com/awslabs/aws-lambda-powertools-typescript/milestone/2){target="_blank"}.

    **Do not use this library for production workloads.**

Logger provides an opinionated logger with output structured as JSON.

## Key features

* Capture key fields from Lambda context, cold start and structures logging output as JSON
* Log Lambda context when instructed (disabled by default)
* Log sampling prints all logs for a percentage of invocations (disabled by default)
* Append additional keys to structured log at any point in time

## Getting started

### Installation

Install the library in your project:

```shell
npm install @aws-lambda-powertools/logger
```

### Utility settings

The library requires two settings. You can set them as environment variables, or pass them in the constructor.

These settings will be used across all logs emitted:

Setting | Description                                                                                                      | Environment variable | Constructor parameter
------------------------------------------------- |------------------------------------------------------------------------------------------------------------------| ------------------------------------------------- | -------------------------------------------------
**Logging level** | Sets how verbose Logger should be (INFO, by default). Supported values are: `DEBUG`, `INFO`, `WARN`, `ERROR`     |  `LOG_LEVEL` | `logLevel`
**Service name** | Sets the name of service of which the Lambda function is part of, that will be present across all log statements | `POWERTOOLS_SERVICE_NAME` | `serviceName`

For a **complete list** of supported environment variables, refer to [this section](./../index.md#environment-variables).

#### Example using AWS Serverless Application Model (SAM)

=== "handler.ts"

    ```typescript hl_lines="1 4"
    import { Logger } from '@aws-lambda-powertools/logger';

    // Logger parameters fetched from the environment variables (see template.yaml tab)
    const logger = new Logger();

    // You can also pass the parameters in the constructor
    // const logger = new Logger({
    //     logLevel: "WARN",
    //     serviceName: "serverlessAirline"
    // });
    ```

=== "template.yaml"

    ```yaml hl_lines="8 9"
    Resources:
      ShoppingCartApiFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs14.x
          Environment:
            Variables:
              LOG_LEVEL: WARN
              POWERTOOLS_SERVICE_NAME: serverlessAirline
    ```

### Standard structured keys

Your Logger will include the following keys to your structured logging (default log formatter):

Key | Example | Note
------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------
**level**: `string` | `INFO` | Logging level set for the Lambda function"s invocation
**message**: `string` | `Query performed to DynamoDB` | A descriptive, human-readable representation of this log item
**sampling_rate**: `float` |  `0.1` | When enabled, it prints all the logs of a percentage of invocations, e.g. 10%
**service**: `string` | `serverlessAirline` | A unique name identifier of the service this Lambda function belongs to, by default `service_undefined`
**timestamp**: `string` | `2011-10-05T14:48:00.000Z` | Timestamp string in simplified extended ISO format (ISO 8601)
**xray_trace_id**: `string` | `1-5759e988-bd862e3fe1be46a994272793` | When [tracing is enabled](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html){target="_blank"}, it shows X-Ray Trace ID
**error**: `Object` | `{ name: "Error", location: "/my-project/handler.ts:18", message: "Unexpected error #1", stack: "[stacktrace]"}` | Optional - An object containing information about the Error passed to the logger

### Capturing Lambda context info

You can enrich your structured logs with key Lambda context information in multiple ways.

This functionality will include the following keys in your structured logs:

Key | Example
------------------------------------------------- | ---------------------------------------------------------------------------------
**cold_start**: `bool` | `false`
**function_name** `string` | `shopping-cart-api-lambda-prod-eu-central-1`
**function_memory_size**: `number` | `128`
**function_arn**: `string` | `arn:aws:lambda:eu-central-1:123456789012:function:shopping-cart-api-lambda-prod-eu-central-1`
**function_request_id**: `string` | `c6af9ac6-7b61-11e6-9a41-93e812345678`

=== "Manual"

    ```typescript hl_lines="7"
    import { Logger } from '@aws-lambda-powertools/logger';

    const logger = new Logger();

    export const handler = async (_event, context): Promise<void> => {
    
        logger.addContext(context);
        
        logger.info('This is an INFO log with some context');

    };
    ```

=== "Middy Middleware"

    !!! note
        Middy comes bundled with Logger, so you can just import it when using the middleware.

    !!! tip "Using Middy for the first time?"
        Learn more about [its usage and lifecycle in the official Middy documentation](https://github.com/middyjs/middy#usage){target="_blank"}.

    ```typescript hl_lines="1-2 10-11"
    import { Logger, injectLambdaContext } from '@aws-lambda-powertools/logger';
    import middy from '@middy/core';

    const logger = new Logger();

    const lambdaHandler = async (_event: any, _context: any): Promise<void> => {
        logger.info('This is an INFO log with some context');
    };

    export const handler = middy(lambdaHandler)
        .use(injectLambdaContext(logger));
    ```

=== "Decorator"

    ```typescript hl_lines="8"
    import { Logger } from '@aws-lambda-powertools/logger';
    import { LambdaInterface } from '@aws-lambda-powertools/commons';

    const logger = new Logger();
    
    class Lambda implements LambdaInterface {
        // Decorate your handler class method
        @logger.injectLambdaContext()
        public async handler(_event: any, _context: any): Promise<void> {
            logger.info('This is an INFO log with some context');
        }

    }

    export const myFunction = new Lambda();
    export const handler = myFunction.handler;
    ```

In each case, the printed log will look like this:

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="2-6"
    {
        "cold_start": true,
        "function_arn": "arn:aws:lambda:eu-central-1:123456789012:function:shopping-cart-api-lambda-prod-eu-central-1",
        "function_memory_size": 128,
        "function_request_id": "c6af9ac6-7b61-11e6-9a41-93e812345678",
        "function_name": "shopping-cart-api-lambda-prod-eu-central-1",
        "level": "INFO",
        "message": "This is an INFO log with some context",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T21:21:08.921Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    ```

### Appending persistent additional log keys and values

You can append additional persistent keys and values in the logs generated during a Lambda invocation using either mechanism:

* Via the Logger's `appendKeys` method, for all log items generated after calling this method
* Passing them in the Logger's constructor

=== "handler.ts"

    ```typescript hl_lines="5-12 16-23"
    import { Logger } from '@aws-lambda-powertools/logger';

    // Add persistent log keys via the constructor
    const logger = new Logger({
        persistentLogAttributes: { 
            aws_account_id: '123456789012',
            aws_region: 'eu-central-1',
            logger: {
                name: '@aws-lambda-powertools/logger',
                version: '0.0.1',
            }
        }
    });

    // OR add persistent log keys to an existing Logger instance with the appendKeys method:
    // logger.appendKeys({
    //     aws_account_id: '123456789012',
    //     aws_region: 'eu-central-1',
    //     logger: {
    //         name: '@aws-lambda-powertools/logger',
    //         version: '0.0.1',
    //     }
    // });    

    export const handler = async (_event: any, _context: any): Promise<unknown> => {
    
        // This info log will print all extra custom attributes added above
        // Extra attributes: logger object with name and version of the logger library, awsAccountId, awsRegion
        logger.info('This is an INFO log');
        logger.info('This is another INFO log');
        
        return {
            foo: 'bar'
        };
    
    };
    ```
=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="8-12 21-25"
    {
        "level": "INFO",
        "message": "This is an INFO log",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T21:49:58.084Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456",
        "aws_account_id": "123456789012",
        "aws_region": "eu-central-1",
        "logger": { 
            "name": "@aws-lambda-powertools/logger",
            "version": "0.0.1"
        }
    }
    {
        "level": "INFO",
        "message": "This is another INFO log",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T21:49:58.088Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456",
        "aws_account_id": "123456789012",
        "aws_region": "eu-central-1",
        "logger": { 
            "name": "@aws-lambda-powertools/logger",
            "version": "0.0.1"
        }
    }
    ```

!!! tip "Logger will automatically ignore any key with an `undefined` value"

### Appending additional log keys and values to a single log item

You can append additional keys and values in a single log item passing them as parameters.

=== "handler.ts"

    ```typescript hl_lines="14 18-19"
    import { Logger } from '@aws-lambda-powertools/logger';

    const logger = new Logger();
    
    export const handler = async (_event: any, _context: any): Promise<unknown> => {
    
        const myImportantVariable = {
            foo: 'bar'
        };
        
        // Pass additional keys and values in single log items
        
        // As second parameter
        logger.info('This is a log with an extra variable', { data: myImportantVariable });
        
        // You can also pass multiple parameters
        logger.info('This is a log with 2 extra variables',
            { data: myImportantVariable },
            { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } }
        );
        
        return {
            foo: 'bar'
        };
    
    };
    ```
=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="7 15-16"
    {
        "level": "INFO",
        "message": "This is a log with an extra variable",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:06:17.463Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456",
        "data": { foo: "bar" }
    }
    {
        "level": "INFO",
        "message": "This is a log with 2 extra variables",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:06:17.466Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456",
        "data": { "foo": "bar" },
        "correlationIds": { "myCustomCorrelationId": "foo-bar-baz" }
    }
    ```

### Logging errors

You can log errors by using the `error` method and pass the error object as parameter.
The error will be logged with default key name `error`, but you can also pass your own custom key name.

=== "handler.ts"

    ```typescript hl_lines="11 18"
    import { Logger } from '@aws-lambda-powertools/logger';

    const logger = new Logger();
    
    export const handler = async (_event: any, _context: any): Promise<void> => {
    
        try {
            throw new Error('Unexpected error #1');
        } catch (error) {
            // Log information about the error using the default "error" key
            logger.error('This is the first error', error);
        }

        try {
            throw new Error('Unexpected error #2');
        } catch (error) {
            // Log information about the error using a custom "myCustomErrorKey" key
            logger.error('This is the second error', { myCustomErrorKey: error } );
        }
    
    };
    ```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="7-12 20-25"
    {
        "level": "ERROR",
        "message": "This is an ERROR log #1",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:12:39.345Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456",
        "error": {
            "name": "Error",
            "location": "/path/to/my/source-code/my-service/handler.ts:18",
            "message": "This is the first error",
            "stack": "Error: Unexpected error #1    at lambdaHandler (/path/to/my/source-code/my-service/handler.ts:18:11)    at Object.<anonymous> (/path/to/my/source-code/my-service/handler.ts:35:1)    at Module._compile (node:internal/modules/cjs/loader:1108:14)    at Module.m._compile (/path/to/my/source-code/node_modules/ts-node/src/index.ts:1371:23)    at Module._extensions..js (node:internal/modules/cjs/loader:1137:10)    at Object.require.extensions.<computed> [as .ts] (/path/to/my/source-code/node_modules/ts-node/src/index.ts:1374:12)    at Module.load (node:internal/modules/cjs/loader:973:32)    at Function.Module._load (node:internal/modules/cjs/loader:813:14)    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:76:12)    at main (/path/to/my/source-code/node_modules/ts-node/src/bin.ts:331:12)"
        }
    }
    {   
        "level": "ERROR",
        "message": "This is an ERROR log #2",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:12:39.377Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456",
        "myCustomErrorKey": {
            "name": "Error",
            "location": "/path/to/my/source-code/my-service/handler.ts:24",
            "message": "This is the second error",
            "stack": "Error: Unexpected error #2    at lambdaHandler (/path/to/my/source-code/my-service/handler.ts:24:11)    at Object.<anonymous> (/path/to/my/source-code/my-service/handler.ts:35:1)    at Module._compile (node:internal/modules/cjs/loader:1108:14)    at Module.m._compile (/path/to/my/source-code/node_modules/ts-node/src/index.ts:1371:23)    at Module._extensions..js (node:internal/modules/cjs/loader:1137:10)    at Object.require.extensions.<computed> [as .ts] (/path/to/my/source-code/node_modules/ts-node/src/index.ts:1374:12)    at Module.load (node:internal/modules/cjs/loader:973:32)    at Function.Module._load (node:internal/modules/cjs/loader:813:14)    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:76:12)    at main (/path/to/my/source-code/node_modules/ts-node/src/bin.ts:331:12)"
        }
    }
    ```

## Advanced

### Using multiple Logger instances across your code

Logger supports quick instance cloning via the `createChild` method.
This can be useful for example if you want to enable multiple Loggers with different logging levels in the same Lambda invocation.

=== "handler.ts"

    ```typescript hl_lines="9-11 18-19"
    import { Logger } from '@aws-lambda-powertools/logger';

    // With this logger, all the INFO logs will be printed
    const logger = new Logger({
        logLevel: 'INFO'
    });

    // With this logger, only the ERROR logs will be printed
    const childLogger = logger.createChild({
        logLevel: 'ERROR'
    });
    
    export const handler = async (_event: any, _context: any): Promise<void> => {
    
        logger.info('This is an INFO log, from the parent logger');
        logger.error('This is an ERROR log, from the parent logger');
        
        childLogger.info('This is an INFO log, from the child logger');
        childLogger.error('This is an ERROR log, from the child logger');
    
    };
    ```

=== "Example CloudWatch Logs excerpt"

    ```json hl_lines="15-21"
    {
        "level": "INFO",
        "message": "This is an INFO log, from the parent logger",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:32:54.667Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    {
        "level": "ERROR",
        "message": "This is an ERROR log, from the parent logger",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:32:54.670Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    {
        "level": "ERROR",
        "message": "This is an ERROR log, from the child logger",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:32:54.670Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    ```

### Sampling logs

Use sampling when you want to print all the log items generated in your code, based on a **percentage of your concurrent/cold start invocations**.

You can do that by setting a "sample rate", a float value ranging from `0.0` (0%) to `1` (100%), by using a `POWERTOOLS_LOGGER_SAMPLE_RATE` env var or passing the `sampleRateValue` parameter in the Logger constructor.
This number represents the probability that a Lambda invocation will print all the log items regardless of the log level setting.

For example, by setting the "sample rate" to `0.5`, roughly 50% of your lambda invocations will print all the log items, including the `debug` ones.

!!! tip "When is this useful?"
    In production, to avoid log data pollution and reduce CloudWatch costs, developers are encouraged to use the logger with `logLevel` equal to `ERROR` or `WARN`.
    This means that only errors or warnings will be printed.

    However, it might still be useful to print all the logs (including debug ones) of a very small percentage of invocations to have a better understanding of the behaviour of your code in production even when there are no errors.
    
    Sampling decision happens at the Logger initialization. This means sampling may happen significantly more or less than depending on your traffic patterns, for example a steady low number of invocations and thus few cold starts.

=== "handler.ts"

    ```typescript hl_lines="6"
    import { Logger } from '@aws-lambda-powertools/logger';

    // Notice the log level set to 'ERROR'
    const logger = new Logger({
        logLevel: 'ERROR',
        sampleRateValue: 0.5
    });
    
    export const handler = async (_event: any, _context: any): Promise<void> => {

        // This log item (equal to log level 'ERROR') will be printed to standard output
        // in all Lambda invocations
        logger.error('This is an ERROR log');

        // These log items (below the log level 'ERROR') have ~50% chance 
        // of being printed in a Lambda invocation
        logger.debug('This is a DEBUG log that has 50% chance of being printed');
        logger.info('This is an INFO log that has 50% chance of being printed');
        logger.warn('This is a WARN log that has 50% chance of being printed');
        
        // Optional: refresh sample rate calculation on runtime
        // logger.refreshSampleRateCalculation();

    };
    ```

=== "Example CloudWatch Logs excerpt - Invocation #1"

    ```json
    {
        "level": "ERROR",
        "message": "This is an ERROR log",
        "sampling_rate": "0.5",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.334Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    {
        "level": "DEBUG",
        "message": "This is a DEBUG log that has 50% chance of being printed",
        "sampling_rate": "0.5", 
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.337Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    {
        "level": "INFO",
        "message": "This is an INFO log that has 50% chance of being printed",
        "sampling_rate": "0.5", 
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.338Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    {
        "level": "WARN",
        "message": "This is a WARN log that has 50% chance of being printed",
        "sampling_rate": "0.5", 
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.338Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    ```

=== "Example CloudWatch Logs excerpt - Invocation #2"

    ```json
    {
        "level": "ERROR",
        "message": "This is an ERROR log",
        "sampling_rate": "0.5",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.334Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    ```

=== "Example CloudWatch Logs excerpt - Invocation #3"

    ```json
    {
        "level": "ERROR",
        "message": "This is an ERROR log",
        "sampling_rate": "0.5",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.334Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    {
        "level": "DEBUG",
        "message": "This is a DEBUG log that has 50% chance of being printed",
        "sampling_rate": "0.5", 
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.337Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    {
        "level": "INFO",
        "message": "This is an INFO log that has 50% chance of being printed",
        "sampling_rate": "0.5", 
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.338Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    {
        "level": "WARN",
        "message": "This is a WARN log that has 50% chance of being printed",
        "sampling_rate": "0.5", 
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.338Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    ```

=== "Example CloudWatch Logs excerpt - Invocation #4"

    ```json
    {
        "level": "ERROR",
        "message": "This is an ERROR log",
        "sampling_rate": "0.5",
        "service": "serverlessAirline",
        "timestamp": "2021-12-12T22:59:06.334Z",
        "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
    }
    ```

### Custom Log formatter (Bring Your Own Formatter)

You can customize the structure (keys and values) of your log items by passing a custom log formatter, an object that implements the `LogFormatter` abstract class.

=== "handler.ts"

    ```typescript hl_lines="2 5"
    import { Logger } from '@aws-lambda-powertools/logger';
    import { MyCompanyLogFormatter } from './utils/formatters/MyCompanyLogFormatter';

    const logger = new Logger({
        logFormatter: new MyCompanyLogFormatter(),
        logLevel: 'DEBUG',
        serviceName: 'serverlessAirline',
        sampleRateValue: 0.5,
        persistentLogAttributes: {
            awsAccountId: process.env.AWS_ACCOUNT_ID,
            logger: {
                name: '@aws-lambda-powertools/logger',
                version: '0.0.1'
            }
        },
    });
    
    export const handler = async (event, context): Promise<void> => {

        logger.addContext(context);

        logger.info('This is an INFO log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

    };
    ```

This is how the `MyCompanyLogFormatter` (dummy name) would look like:

=== "utils/formatters/MyCompanyLogFormatter.ts"

    ```typescript
    import { LogFormatter } from '@aws-lambda-powertools/logger';
    import { LogAttributes, UnformattedAttributes } from '@aws-lambda-powertools/logger/lib/types';
    
    // Replace this line with your own type
    type MyCompanyLog = LogAttributes;
    
    class MyCompanyLogFormatter extends LogFormatter {
    
        public formatAttributes(attributes: UnformattedAttributes): MyCompanyLog {
            return {
                message: attributes.message,
                service: attributes.serviceName,
                environment: attributes.environment,
                awsRegion: attributes.awsRegion,
                correlationIds: {
                    awsRequestId: attributes.lambdaContext?.awsRequestId,
                    xRayTraceId: attributes.xRayTraceId
                },
                lambdaFunction: {
                    name: attributes.lambdaContext?.functionName,
                    arn: attributes.lambdaContext?.invokedFunctionArn,
                    memoryLimitInMB: attributes.lambdaContext?.memoryLimitInMB,
                    version: attributes.lambdaContext?.functionVersion,
                    coldStart: attributes.lambdaContext?.coldStart,
                },
                logLevel: attributes.logLevel,
                timestamp: this.formatTimestamp(attributes.timestamp), // You can extend this function
                logger: {
                    sampleRateValue: attributes.sampleRateValue,
                },
            };
        }
        
    }
    
    export {
        MyCompanyLogFormatter
    };
    ```

This is how the printed log would look:

=== "Example CloudWatch Logs excerpt"

    ```json
        {
            "message": "This is an INFO log",
            "service": "serverlessAirline",
            "awsRegion": "eu-central-1",
            "correlationIds": {
                "awsRequestId": "c6af9ac6-7b61-11e6-9a41-93e812345678",
                "xRayTraceId": "abcdef123456abcdef123456abcdef123456",
                "myCustomCorrelationId": "foo-bar-baz"
            },
            "lambdaFunction": {
                "name": "shopping-cart-api-lambda-prod-eu-central-1",
                "arn": "arn:aws:lambda:eu-central-1:123456789012:function:shopping-cart-api-lambda-prod-eu-central-1",
                "memoryLimitInMB": 128,
                "version": "$LATEST",
                "coldStart": true
            },
            "logLevel": "INFO",
            "timestamp": "2021-12-12T23:13:53.404Z",
            "logger": {
                "sampleRateValue": "0.5",
                "name": "aws-lambda-powertools-typescript",
                "version": "0.0.1"
            },
            "awsAccountId": "123456789012"
        }
    ```

## Testing your code

### Inject Lambda Context

When unit testing your code that makes use of `logger.addContext()` or `injectLambdaContext` middleware and decorator, you can optionally pass a dummy Lambda Context if you want your logs to contain this information.

This is a Jest sample that provides the minimum information necessary for Logger to inject context data:

=== "handler.test.ts"

    ```typescript

    const dummyContext = {
        callbackWaitsForEmptyEventLoop: true,
        functionVersion: '$LATEST',
        functionName: 'foo-bar-function',
        memoryLimitInMB: '128',
        logGroupName: '/aws/lambda/foo-bar-function',
        logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
        invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:foo-bar-function',
        awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
        getRemainingTimeInMillis: () => 1234,
        done: () => console.log('Done!'),
        fail: () => console.log('Failed!'),
        succeed: () => console.log('Succeeded!'),
    };

    describe('MyUnitTest', () => {

        test('Lambda invoked successfully', async () => {
        
            const testEvent = { test: 'test' };
            await handler(testEvent, dummyContext);

        });

    });

    ```

!!! tip
    If you don't want to declare your own dummy Lambda Context, you can use [`ContextExamples.helloworldContext`](https://github.com/awslabs/aws-lambda-powertools-typescript/blob/main/packages/commons/src/tests/resources/contexts/hello-world.ts#L3-L16) from [`@aws-lambda-powertools/commons`](https://www.npmjs.com/package/@aws-lambda-powertools/commons).
