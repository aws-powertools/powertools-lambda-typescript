# Powertools for AWS Lambda (TypeScript) <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Usage](#usage)
    - [Basic usage](#basic-usage)
    - [Inject Lambda context](#inject-lambda-context)
    - [Logging incoming event](#logging-incoming-event)
    - [Append additional keys and data](#append-additional-keys-and-data)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
    - [Becoming a reference customer](#becoming-a-reference-customer)
    - [Sharing your work](#sharing-your-work)
    - [Using Lambda Layer](#using-lambda-layer)
- [License](#license)

## Intro

The Logger utility provides a structured logging experience with additional features tailored for AWS Lambda functions.

## Usage

To get started, install the library by running:

```sh
npm i @aws-lambda-powertools/logger
```

### Basic usage

Initialize the logger with a service name and log messages:

```ts  
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'serverlessAirline' });

export const handler = async (_event, _context): Promise<void> => {
  logger.info('Hello World');
  
};
```

You can also log errors and additional data:

```ts
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  try {
    throw new Error('Unexpected error #1');
  } catch (error) {
    // Log information about the error using the default "error" key
    logger.error('This is the first error', error as Error);
  }

  try {
    throw new Error('Unexpected error #2');
  } catch (error) {
    // Log information about the error using a custom "myCustomErrorKey" key
    logger.error('This is the second error', {
      myCustomErrorKey: error as Error,
    });
  }
};
```

### Inject Lambda context

You can enrich your structured logs with key Lambda context information:

```ts
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();

export const handler = async (
  _event: unknown,
  context: Context
): Promise<void> => {
  logger.addContext(context);

  logger.info('This is an INFO log with some context');
};
```

The log statement will look like this:

```json
{
    "cold_start": true,
    "function_arn": "arn:aws:lambda:eu-west-1:123456789012:function:shopping-cart-api-lambda-prod-eu-west-1",
    "function_memory_size": 128,
    "function_request_id": "c6af9ac6-7b61-11e6-9a41-93e812345678",
    "function_name": "shopping-cart-api-lambda-prod-eu-west-1",
    "level": "INFO",
    "message": "This is an INFO log with some context",
    "service": "serverlessAirline",
    "timestamp": "2021-12-12T21:21:08.921Z",
    "xray_trace_id": "abcdef123456abcdef123456abcdef123456"
}
```

### Logging incoming event

You can log the incoming event with (here as decorator, works also as middy middleware):

```ts
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

class Lambda implements LambdaInterface {
  // Set the log event flag to true
  @logger.injectLambdaContext({ logEvent: true })
  public async handler(_event: unknown, _context: unknown): Promise<void> {
    logger.info('This is an INFO log with some context');
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction); //
```

### Append additional keys and data

Append additional keys:

```ts
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger();

export const handler = async (
  event: unknown,
  _context: unknown
): Promise<unknown> => {
  const myImportantVariable = {
    foo: 'bar',
  };

  // Log additional data in single log items
  // As second parameter
  logger.info('This is a log with an extra variable', {
    data: myImportantVariable,
  });

  // You can also pass multiple parameters containing arbitrary objects
  logger.info(
    'This is a log with 3 extra objects',
    { data: myImportantVariable },
    { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } },
    { lambdaEvent: event }
  );

  // Simply pass a string for logging additional data
  logger.info('This is a log with additional string value', 'string value');

  // Directly passing an object containing both the message and the additional info
  const logObject = {
    message: 'This is a log message',
    additionalValue: 42,
  };

  logger.info(logObject);

  return {
    foo: 'bar',
  };
};
```

Add **persistent keys** to the logger instance:

```ts
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({
  serviceName: 'serverlessAirline',
  persistentKeys: {
    environment: 'prod',
    version: process.env.BUILD_VERSION,
  },
});

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  logger.info('processing transaction');

  // ... your business logic
};
```

## Contribute

If you are interested in contributing to this project, please refer to
our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities
by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues),
or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub
repository.

## Connect

- **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
- **Email**: <aws-lambda-powertools-feedback@amazon.com>

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company
is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by
raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://s12d.com/become-reference-pt-ts)
issue.

The following companies, among others, use Powertools:

- [Alma Media](https://www.almamedia.fi)
- [AppYourself](https://appyourself.net)
- [Bailey Nelson](https://www.baileynelson.com.au)
- [Banxware](https://www.banxware.com)
- [Caylent](https://caylent.com/)
- [Certible](https://www.certible.com/)
- [Elva](https://elva-group.com)
- [globaldatanet](https://globaldatanet.com/)
- [Hashnode](https://hashnode.com/)
- [LocalStack](https://localstack.cloud/)
- [Perfect Post](https://www.perfectpost.fr)
- [Sennder](https://sennder.com/)
- [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
- [Trek10](https://www.trek10.com/)
- [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and
others. Check out what the community has already shared about Powertools for AWS Lambda (
TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain
future investments for other Powertools for AWS Lambda languages.
When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/#lambda-layer), you can add Powertools as a
dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
