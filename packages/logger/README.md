# `logger`

##  Usage

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

```typescript
// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
process.env.POWERTOOLS_CONTEXT_ENABLED = 'TRUE';

const logger = new Logger();

const lambdaHandler: Handler = async (event, context) => {
  logger.addContext(context); // This should be in a custom Middy middleware https://github.com/middyjs/middy

  logger.debug('This is a DEBUG log');
  logger.info('This is an INFO log');
  logger.warn('This is a WARN log');
  logger.error('This is an ERROR log');

  return {
    foo: 'bar'
  };

};

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  aws_request_id: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
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
  aws_request_id: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
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


### Appending additional keys

```typescript

// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

const logger = new Logger();

const lambdaHandler: Handler = async () => {

  // Pass a custom correlation ID
  logger.warn('This is a WARN log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

  // Pass an error that occurred
  logger.error('This is an ERROR log', new Error('Something bad happened!'));

  return {
    foo: 'bar'
  };

};

```

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  level: 'WARN',
  message: 'This is a WARN log',
  service: 'hello-world',
  timestamp: '2021-03-13T20:21:28.423Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
  correlationIds: { myCustomCorrelationId: 'foo-bar-baz' }
}
{
  level: 'ERROR',
  message: 'This is an ERROR log',
  service: 'hello-world',
  timestamp: '2021-03-13T20:21:28.426Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456',
  error: {
    name: 'Error',
    message: 'Something bad happened!',
    stack: 'Error: Something bad happened!\n' +
      '    at lambdaHandler (/Users/username/Workspace/projects/aws-lambda-powertools-typescript/packages/logger/examples/additional-keys.ts:22:40)\n' +
      '    at Object.<anonymous> (/Users/username/Workspace/projects/aws-lambda-powertools-typescript/packages/logger/examples/additional-keys.ts:30:1)\n' +
      '    at Module._compile (node:internal/modules/cjs/loader:1108:14)\n' +
      '    at Module.m._compile (/Users/username/Workspace/projects/aws-lambda-powertools-typescript/packages/logger/node_modules/ts-node/src/index.ts:1056:23)\n' +
      '    at Module._extensions..js (node:internal/modules/cjs/loader:1137:10)\n' +
      '    at Object.require.extensions.<computed> [as .ts] (/Users/username/Workspace/projects/aws-lambda-powertools-typescript/packages/logger/node_modules/ts-node/src/index.ts:1059:12)\n' +
      '    at Module.load (node:internal/modules/cjs/loader:973:32)\n' +
      '    at Function.Module._load (node:internal/modules/cjs/loader:813:14)\n' +
      '    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:76:12)\n' +
      '    at main (/Users/username/Workspace/projects/aws-lambda-powertools-typescript/packages/logger/node_modules/ts-node/src/bin.ts:198:14)'
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
  timestamp: '2021-03-13T20:33:41.128Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}
{
  level: 'ERROR',
  message: 'This is an ERROR log, from the parent logger',
  service: 'hello-world',
  timestamp: '2021-03-13T20:33:41.130Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}
{
  level: 'ERROR',
  message: 'This is an ERROR log, from the child logger',
  service: 'hello-world',
  timestamp: '2021-03-13T20:33:41.131Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}

```
</details>


### Sampling debug logs

```typescript

// Environment variables set for the Lambda
process.env.LOG_LEVEL = 'WARN';
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

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

<details>
 <summary>Click to expand and see the logs outputs</summary>

```bash

{
  level: 'INFO',
  message: 'This is INFO log #2',
  sampling_rate: 0.5,
  service: 'hello-world',
  timestamp: '2021-03-13T20:45:06.093Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}
{
  level: 'INFO',
  message: 'This is INFO log #4',
  sampling_rate: 0.5,
  service: 'hello-world',
  timestamp: '2021-03-13T20:45:06.096Z',
  xray_trace_id: 'abcdef123456abcdef123456abcdef123456'
}

```

</details>

## Custom logger options: log level, service name, sample rate value, log attributes, variables source, log format

```typescript

process.env.CUSTOM_ENV = 'prod';
process.env.POWERTOOLS_CONTEXT_ENABLED = 'TRUE';

// Custom configuration service for variables, and custom formatter to comply to different log JSON schema
import { CustomConfigService } from './config/CustomConfigService';
import { CustomLogFormatter } from './formatters/CustomLogFormatter';

const logger = new Logger({
  logLevel: 'INFO',                               // Override options
  serviceName: 'foo-bar',
  sampleRateValue: 0.00001,
  customAttributes: {                             // Custom attributes that will be added in every log
    awsAccountId: '123456789012',
    logger: {
      name: powertool.name,
      version: powertool.version,
    }
  },
  logFormatter: new CustomLogFormatter(),        // Custom log formatter to print the log in a custom format (JSON schema)
  customConfigService: new CustomConfigService() // Custom config service, that could be used for AppConfig for example
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
  service: 'foo-bar',
  environment: 'prod',
  awsRegion: 'eu-central-1',
  correlationIds: {
    awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
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
  timestamp: '2021-03-13T21:43:47.759Z',
  logger: {
    sampleRateValue: 0.00001,
    name: 'aws-lambda-powertools-typescript',
    version: '0.0.1'
  },
  awsAccountId: '123456789012'
}

```

</details>

##  Test locally

```bash

npm run test

npm run example:hello-world
npm run example:hello-world-with-context
npm run example:custom-logger-options
npm run example:child-logger

```
