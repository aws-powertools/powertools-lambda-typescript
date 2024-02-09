---
title: Upgrade guide
description: Guide to update between major Powertools for AWS Lambda (TypeScript) versions
---

## Migrate from v1 to v2


V2 is focused on official support for ESM (ECMAScript modules). We've made other minimal breaking changes to make your transition to v2 as smooth as possible.

### Quick summary


| Area                                   | Change                                                                                                                                           | Code change required |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| **ESM support**                 | Added ESM support via dual CommonJS and ESM bundling, enabling top-level `await` and tree-shaking.                              | -                    |
| **Middy.js middleware imports**        | Updated import path for Middy.js middlewares to leverage subpath exports - i.e. `@aws-lambda-powertools/tracer/middleware`.                      | Yes                  |
| **Types imports**                      | Updated import path for TypeScript types to leverage subpath exports - i.e. `@aws-lambda-powertools/logger/types`.                               | Yes                  |
| **Logger - log sampling**              | Changed implementation of [log sampling](./core/logger.md#sampling-logs) to dynamically switch log level to `DEBUG` on a percentage of requests. | -                    |
| **Logger - Custom Log Formatter**      | Updated [custom log formatter](#custom-log-formatter) to include additional persistent attributes along with standard structured keys.           | Yes                  |
| **Logger & Tracer - helper functions** | Removed deprecated `createLogger` and `createTracer` helper functions in favor of direct instantiation.                                          | Yes                  |

### First steps

Before you start, we suggest making a copy of your current working project or create a new git branch.

1. Upgrade Node.js to v16 or higher, Node.js v20 is recommended.
2. Ensure that you have the latest Powertools for AWS Lambda (TypeScript) version via [Lambda Layer](./index.md#lambda-layer) or npm.
3. Review the following sections to confirm whether they apply to your codebase.

## ES Modules support

Starting with v2, Powertools for AWS Lambda (TypeScript) supports ES Modules. This means that you can now import the package using the `import` syntax instead of the `require` syntax. This is especially useful if you want to leverage features like top-level `await` in your Lambda function to run asynchronous code during the initialization phase.

```typescript
import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

// This code will run during the initialization phase of your Lambda function
const myApiKey = await getSecret('my-api-key', { transform: 'json' });

export const handler = async () => {
    // ...
};
```

With this change, you can also apply tree-shaking to your function bundle to reduce its size. As part of this release we have made changes to the package and its exports to better support this feature, and we remain committed to improving this in the future based on your feedback.

While we recommend using ES Modules, we understand that this change might not be possible for everyone. If you're unable to use ES Modules, you can continue to use the `require` syntax to import the package. Powertools for AWS Lambda (TypeScript) will continue to support this syntax by shipping CommonJS modules alongside ES Modules.

In some cases, even when opting for ES Modules, you might still need to use the `require` syntax to import a package. For example, if you're using a package that doesn't support ES Modules, or if one of your transitive dependencies is using the `require` syntax like it's the case for `@aws-lambda-powertools/tracer` which relies on the AWS X-Ray SDK for Node.js. In these cases, you can still use ES Modules for the rest of your codebase and set a special build flag to tell your bundler to inject a banner at the top of the file to use the `require` syntax for the specific package.

=== "With AWS CDK"

    ```typescript hl_lines="15 20-21"
    import { Stack, type StackProps } from 'aws-cdk-lib';
    import { Construct } from 'constructs';
    import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
    import { Runtime } from 'aws-cdk-lib/aws-lambda';

    export class MyStack extends Stack {
      public constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const handler = new NodejsFunction(this, 'helloWorldFunction', {
          runtime: Runtime.NODEJS_20_X,
          handler: 'handler',
          entry: 'src/index.ts',
          bundling: {
            format: OutputFormat.ESM,
            minify: true,
            esbuildArgs: {
              "--tree-shaking": "true",
            },
            banner: 
              "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
          },
        });
      }
    }
    ```

=== "With AWS SAM"

    ```yaml hl_lines="14 17-18"
    Transform: AWS::Serverless-2016-10-31
    Resources:
      HelloWorldFunction:
        Type: AWS::Serverless::Function
        Properties:
          Runtime: nodejs20.x
          Handler: src/index.handler
        Metadata:
          BuildMethod: esbuild
          BuildProperties:
            Minify: true
            Target: 'ES2020'
            Sourcemap: true
            Format: esm
            EntryPoints:
              - src/index.ts
            Banner:
              js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);"
 
    ```

## Scoped imports

### Middy.js middleware imports

Code changes are required only if you're using Middy.js middlewares, however this update benefits especially those who are **not** using Middy.js middlewares due to less code being imported and bundled in your Lambda function.

In v1, you could importing Middy.js middlewares in your codebase directly from the default export of a package. For example, to import the `injectLambdaContext` middleware for Logger, you would import it from `@aws-lambda-powertools/logger`. 

With v2, we've added support for subpath exports. This means that you can now import Middy.js middlewares directly from a well-known path, i.e. `@aws-lambda-powertools/logger/middleware`. This allows you to import the middleware only when you need it, instead of requiring it and having it bundled in your Lambda function when you import the package.

### Types imports

In v1, importing TypeScript types in your codebase required you to be aware of the underlying directory structure of the Powertools for AWS Lambda (TypeScript) package. For example, to import a type from the `@aws-lambda-powertools/logger` package, you would need to import it from `@aws-lambda-powertools/logger/lib/types`.

Starting with v2, we've added support for subpath exports. This means that you can now import types directly from a well-known path, i.e. `@aws-lambda-powertools/logger/types`. This makes it easier and cleaner to import types in your codebase and removes the likelihood of breaking changes in the future.

## Logger

### Log sampling

This only applies if you're using the [log sampling](./core/logger.md#sampling-logs) feature in your codebase.

In v1, the `sampleRateValue` attribute could be set to a value between 0 and 1 when instantiating the `Logger` class. This value was used to determine the percentage of requests that would print logs at any log level regardless of the log level set in the `Logger` class.

For example, by setting the sample rate to 0.5 together with log level `ERROR`, roughly 50% of your Lambda invocations would print all the log items, including the `debug`, `info`, and `warn` ones.

```typescript
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
    logLevel: 'ERROR',
    sampleRateValue: 0.5,
});

export const handler = async () => {
    // This log item (equal to log level 'ERROR') will be printed to standard output
    // in all Lambda invocations
    logger.error('This is an ERROR log');

    // These log items (below the log level 'ERROR') have ~50% chance
    // of being printed in a Lambda invocation
    logger.debug('This is a DEBUG log that has 50% chance of being printed');
    logger.info('This is an INFO log that has 50% chance of being printed');
    logger.warn('This is a WARN log that has 50% chance of being printed');
};
```

In v2, the `sampleRateValue` attribute is now used to determine the approximate percentage of requests that will have their log level switched to `DEBUG`. This means that the log level set in the `Logger` class will be used for all Lambda invocations, but for a percentage of them, the log level will be switched to `DEBUG` and all log items will be printed to standard output.

With this new behavior, you should see roughly the same number of log items printed to standard output as in v1, however, the implementation and logic is now in line with other runtimes of Powertools for AWS Lambda like Python, Java, and .NET.

### Custom log formatter

This only applies if you're using [a custom log formatter](./core/logger.md#custom-log-formatter-bring-your-own-formatter) to customize the log output.

Previously, the `formatAttributes` method was called with a single argument `attributes` of type `UnformattedAttributes`. This object contained all the [standard structured keys](./core/logger.md#standard-structured-keys) and values managed by Powertools for AWS Lambda (TypeScript). The method returned a plain object with the keys and values you wanted to include in the log output.

```typescript hl_lines="5 8"
import { LogFormatter } from '@aws-lambda-powertools/logger';
import {
  LogAttributes,
  UnformattedAttributes,
} from '@aws-lambda-powertools/logger/lib/types';

class MyCompanyLogFormatter extends LogFormatter {
  public formatAttributes(attributes: UnformattedAttributes): LogAttributes {
    return {
      message: attributes.message,
      service: attributes.serviceName,
      environment: attributes.environment,
      awsRegion: attributes.awsRegion,
      correlationIds: {
        awsRequestId: attributes.lambdaContext?.awsRequestId,
        xRayTraceId: attributes.xRayTraceId,
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

export { MyCompanyLogFormatter };
```

In v2, the `formatAttributes` method is instead called with two arguments `attributes` and `additionalLogAttributes`. The `attributes` argument is the same as in v1, but the `additionalLogAttributes` argument is a plain object containing any [additional attributes you might have added](./core/logger.md#appending-persistent-additional-log-keys-and-values) to your logger. The method returns a `LogItem` object that contains all the attributes you want to include in the log output.

```typescript hl_lines="1-2 5-8"
import { LogFormatter, LogItem } from '@aws-lambda-powertools/logger';
import type { LogAttributes, UnformattedAttributes } from '@aws-lambda-powertools/logger/types';

class MyCompanyLogFormatter extends LogFormatter {
  public formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem {
    const baseAttributes = {
        message: attributes.message,
        service: attributes.serviceName,
        environment: attributes.environment,
        awsRegion: attributes.awsRegion,
        correlationIds: {
            awsRequestId: attributes.lambdaContext?.awsRequestId,
            xRayTraceId: attributes.xRayTraceId,
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
    // Create a new LogItem with the base attributes
    const logItem = new LogItem({ attributes: baseAttributes });
    // Merge additional attributes
    logItem.addAttributes(additionalLogAttributes);

    return logItem;
  }
}

export { MyCompanyLogFormatter };
```

## Helper functions

We removed the deprecated `createLogger` and `createTracer` heper functions.

```typescript
import { createLogger } from '@aws-lambda-powertools/logger';
import { createTracer } from '@aws-lambda-powertools/tracer';

const logger = createLogger({ logLevel: 'info' });
const tracer = createTracer({ serviceName: 'my-service' });
```

You can migrate to instantiating the `Logger` and `Tracer` classes directly with no additional changes.

```typescript
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

const logger = new Logger({ logLevel: 'info' });
const tracer = new Tracer({ serviceName: 'my-service' });
```
