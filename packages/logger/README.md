# `logger`


##  Usage

```bash

npm run test

npm run example:hello-world
npm run example:inject-context
npm run example:inject-context-decorator
npm run example:inject-context-middleware
npm run example:errors
npm run example:constructor-options
npm run example:custom-log-formatter
npm run example:child-logger
npm run example:additional-keys
npm run example:sample-rate
npm run example:persistent-attributes
npm run example:ephemeral-attributes

```


### Getting started

```typescript
// Import the library
import { Logger } from '../src';
// When going public, it will be something like: import { Logger } from '@aws-lambda-powertools/logger';

// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

// Instantiate the Logger with default configuration
const logger = new Logger();

// Log with different levels
logger.debug('This is a DEBUG log');
logger.info('This is an INFO log');
logger.warn('This is a WARN log');
logger.error('This is an ERROR log');

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  level: 'WARN',
  message: 'This is a WARN log',
  service: 'hello-world',
  timestamp: '2021-03-13T18:02:49.280Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}
{
  level: 'ERROR',
  message: 'This is an ERROR log',
  service: 'hello-world',
  timestamp: '2021-03-13T18:02:49.282Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}

```
</details>


### Capturing Lambda context info

With the middy middleware `injectLambdaContext`:

```typescript
// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
import { injectLambdaContext } from '../src/middleware/middy';
import middy from '@middy/core';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  logger.info('This is an INFO log');

  return {
    foo: 'bar'
  };

};

const handlerWithMiddleware = middy(lambdaHandler)
  .use(injectLambdaContext(logger));

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  aws_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  cold_start: true,
  lambda_function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
  lambda_function_memory_size: 128,
  lambda_function_name: 'foo-bar-function',
  level: 'WARN',
  message: 'This is a WARN log',
  service: 'hello-world',
  timestamp: '2021-03-13T18:11:46.919Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}
{
  aws_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  cold_start: true,
  lambda_function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
  lambda_function_memory_size: 128,
  lambda_function_name: 'foo-bar-function',
  level: 'ERROR',
  message: 'This is an ERROR log',
  service: 'hello-world',
  timestamp: '2021-03-13T18:11:46.921Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}

```
</details>

With the `addContext` method:

```typescript
// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  logger.addContext(context);

  logger.info('This is an INFO log');

  return {
    foo: 'bar'
  };

};

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  cold_start: true,
  function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:foo-bar-function',
  function_memory_size: 128,
  function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  function_name: 'foo-bar-function',
  level: 'INFO',
  message: 'This is an INFO log',
  service: 'hello-world',
  timestamp: '2021-12-15T23:56:17.773Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}

```
</details>


With decorators:

```typescript
// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const logger = new Logger();

class Lambda implements LambdaInterface {

  @logger.injectLambdaContext()
  public handler<TEvent, TResult>(_event: TEvent, _context: Context, _callback: Callback<TResult>): void | Promise<TResult> {

    logger.info('This is an INFO log with some context');

  }

}

new Lambda().handler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  cold_start: true,
  function_arn: 'arn:aws:lambda:eu-central-1:123456789012:function:foo-bar-function',
  function_memory_size: 128,
  function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  function_name: 'foo-bar-function',
  level: 'INFO',
  message: 'This is an INFO log with some context',
  service: 'hello-world',
  timestamp: '2021-12-15T23:57:25.749Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}

```
</details>


### Appending additional ephemeral keys

```typescript

// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'INFO';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  const myImportantVariable = {
    foo: 'bar'
  };

  // Pass a variable
  logger.info('This is a log with an extra variable', { data: { myImportantVariable } });

  // Pass a variable
  const myOtherImportantVariable = {
    biz: 'baz'
  };

  // Pass multiple variables
  logger.info('This is a log with 2 extra variables', {
    data: { myOtherImportantVariable },
    correlationIds: { myCustomCorrelationId: 'foo-bar-baz' }
  });

  return {
    foo: 'bar'
  };

};


```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  level: 'INFO',
  message: 'This is a log with an extra variable',
  service: 'hello-world',
  timestamp: '2021-03-25T09:30:55.097Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
  data: { myImportantVariable: { foo: 'bar' } }
}
{
  level: 'INFO',
  message: 'This is a log with 2 extra variables',
  service: 'hello-world',
  timestamp: '2021-03-25T09:30:55.102Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
  data: { myOtherImportantVariable: { biz: 'baz' } },
  correlationIds: { myCustomCorrelationId: 'foo-bar-baz' }
}

```
</details>


### Log errors

```typescript

// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  try {
    throw new Error('Unexpected error #1');
  } catch (error) {
    logger.error('This is an ERROR log #1', error);
  }

  try {
    throw new Error('Unexpected error #2');
  } catch (error) {
    logger.error('This is an ERROR log #2', { myCustomErrorKey: error } );
  }

  return {
    foo: 'bar'
  };

};

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  level: 'ERROR',
  message: 'This is an ERROR log #1',
  service: 'hello-world',
  timestamp: '2021-03-25T10:55:46.590Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
  error: {
    name: 'Error',
    location: '/projects/aws-lambda-powertools-typescript/packages/logger/examples/errors.ts:19',
    message: 'Unexpected error #1',
    stack: 'Error: Unexpected error #1\n' +
      '    at lambdaHandler (/projects/aws-lambda-powertools-typescript/packages/logger/examples/errors.ts:19:11)\n' +
      '    at Object.<anonymous> (/projects/aws-lambda-powertools-typescript/packages/logger/examples/errors.ts:36:1)\n' +
      '    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n' +
      '    at Module.m._compile (/projects/aws-lambda-powertools-typescript/packages/logger/node_modules/ts-node/src/index.ts:1056:23)\n' +
      '    at Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n' +
      '    at Object.require.extensions.<computed> [as .ts] (/projects/aws-lambda-powertools-typescript/packages/logger/node_modules/ts-node/src/index.ts:1059:12)\n' +
      '    at Module.load (node:internal/modules/cjs/loader:973:32)\n' +
      '    at Function.Module._load (node:internal/modules/cjs/loader:813:14)\n' +
      '    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:76:12)\n' +
      '    at main (/projects/aws-lambda-powertools-typescript/packages/logger/node_modules/ts-node/src/bin.ts:198:14)'
  }
}
{
  level: 'ERROR',
  message: 'This is an ERROR log #2',
  service: 'hello-world',
  timestamp: '2021-03-25T10:55:46.624Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
  myCustomErrorKey: {
    name: 'Error',
    location: '/projects/aws-lambda-powertools-typescript/packages/logger/examples/errors.ts:25',
    message: 'Unexpected error #2',
    stack: 'Error: Unexpected error #2\n' +
      '    at lambdaHandler (/projects/aws-lambda-powertools-typescript/packages/logger/examples/errors.ts:25:11)\n' +
      '    at Object.<anonymous> (/projects/aws-lambda-powertools-typescript/packages/logger/examples/errors.ts:36:1)\n' +
      '    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n' +
      '    at Module.m._compile (/projects/aws-lambda-powertools-typescript/packages/logger/node_modules/ts-node/src/index.ts:1056:23)\n' +
      '    at Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n' +
      '    at Object.require.extensions.<computed> [as .ts] (/projects/aws-lambda-powertools-typescript/packages/logger/node_modules/ts-node/src/index.ts:1059:12)\n' +
      '    at Module.load (node:internal/modules/cjs/loader:973:32)\n' +
      '    at Function.Module._load (node:internal/modules/cjs/loader:813:14)\n' +
      '    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:76:12)\n' +
      '    at main (/projects/aws-lambda-powertools-typescript/packages/logger/node_modules/ts-node/src/bin.ts:198:14)'
  }
}

```
</details>


### Reusing Logger across your code

```typescript
// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'INFO';

const parentLogger = new Logger();

const childLogger = parentLogger.createChild({
  logLevel: 'ERROR'
});

const lambdaHandler: Handler = async () => {

  parentLogger.info('This is an INFO log, from the parent logger');
  parentLogger.error('This is an ERROR log, from the parent logger');

  childLogger.info('This is an INFO log, from the child logger');
  childLogger.error('This is an ERROR log, from the child logger');

  return {
    foo: 'bar'
  };

};

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  level: 'INFO',
  message: 'This is an INFO log, from the parent logger',
  service: 'hello-world',
  timestamp: '2021-03-25T09:34:06.652Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}
{
  level: 'ERROR',
  message: 'This is an ERROR log, from the parent logger',
  service: 'hello-world',
  timestamp: '2021-03-25T09:34:06.656Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}
{
  level: 'ERROR',
  message: 'This is an ERROR log, from the child logger',
  service: 'hello-world',
  timestamp: '2021-03-25T09:34:06.656Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}

```
</details>


### Sampling debug logs

```typescript

// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
process.env.POWERTOOLS_LOGGER_SAMPLE_RATE = '0.5';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  logger.info('This is INFO log #1');
  logger.info('This is INFO log #2');
  logger.info('This is INFO log #3');
  logger.info('This is INFO log #4');

  return {
    foo: 'bar'
  };

};


```


## Constructor options

```typescript

const logger = new Logger({
  logLevel: 'DEBUG',
  serviceName: 'hello-world',
  sampleRateValue: 0.5,
  persistentLogAttributes: { // Custom attributes that will be added in every log item
    awsAccountId: process.env.AWS_ACCOUNT_ID || '123456789012',
    logger: {
      name: powertool.name,
      version: powertool.version,
    }
  },
});

const lambdaHandler: Handler = async () => {

  logger.info('This is an INFO log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

  return {
    foo: 'bar'
  };
};

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  level: 'INFO',
  message: 'This is an INFO log',
  sampling_rate: 0.5,
  service: 'hello-world',
  timestamp: '2021-03-25T09:59:31.252Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
  awsAccountId: '123456789012',
  logger: { name: 'aws-lambda-powertools-typescript', version: '0.0.1' },
  correlationIds: { myCustomCorrelationId: 'foo-bar-baz' }
}

```

</details>

## Custom log formatter

```typescript

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
      timestamp: this.formatTimestamp(attributes.timestamp),
      logger: {
        sampleRateValue: attributes.sampleRateValue,
      },
    };
  }

}

```

```typescript

const logger = new Logger({
  logFormatter: new MyCompanyLogFormatter(), // Custom log formatter to print the log in a custom structure
  logLevel: 'DEBUG',
  serviceName: 'hello-world',
  sampleRateValue: 0.5,
  persistentLogAttributes: { // Custom attributes that will be added in every log item
    awsAccountId: process.env.AWS_ACCOUNT_ID || '123456789012',
    logger: {
      name: powertool.name,
      version: powertool.version,
    }
  },
});

const lambdaHandler: Handler = async (event, context) => {
  logger.addContext(context);

  logger.info('This is an INFO log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

  return {
    foo: 'bar'
  };
};

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  message: 'This is an INFO log',
  service: 'hello-world',
  awsRegion: 'eu-central-1',
  correlationIds: {
    awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
    xRayTraceId: 'abcdef123456abcdef123456abcdef123456',
    myCustomCorrelationId: 'foo-bar-baz'
  },
  lambdaFunction: {
    name: 'foo-bar-function',
    arn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
    memoryLimitInMB: 128,
    version: '$LATEST',
    coldStart: true
  },
  logLevel: 'INFO',
  timestamp: '2021-03-25T10:00:37.194Z',
  logger: {
    sampleRateValue: 0.5,
    name: 'aws-lambda-powertools-typescript',
    version: '0.0.1'
  },
  awsAccountId: '123456789012'
}

```

</details>