# Powertools for AWS Lambda (TypeScript) - Idempotency Utility <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the package in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Key features](#key-features)
- [Usage](#usage)
    - [Function wrapper](#function-wrapper)
    - [Decorator](#decorator)
    - [Middy middleware](#middy-middleware)
    - [DynamoDB persistence layer](#dynamodb-persistence-layer)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
    - [Becoming a reference customer](#becoming-a-reference-customer)
    - [Sharing your work](#sharing-your-work)
    - [Using Lambda Layer](#using-lambda-layer)
- [License](#license)

## Intro

This package provides a utility to implement idempotency in your Lambda functions.
You can either use it to wrap a function, decorate a method, or as Middy middleware to make your AWS Lambda handler idempotent.

The current implementation provides a persistence layer for Amazon DynamoDB, which offers a variety of configuration options. You can also bring your own persistence layer by extending the `BasePersistenceLayer` class.

## Key features

- Prevent Lambda handler from executing more than once on the same event payload during a time window
- Ensure Lambda handler returns the same result when called with the same payload
- Select a subset of the event as the idempotency key using JMESPath expressions
- Set a time window in which records with the same payload should be considered duplicates
- Expires in-progress executions if the Lambda function times out halfway through

## Usage

To get started, install the library by running:

```sh
npm i @aws-lambda-powertools/idempotency @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

Next, review the IAM permissions attached to your AWS Lambda function and make sure you allow the [actions detailed](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/#iam-permissions) in the documentation of the utility.

### Function wrapper

You can make any function idempotent, and safe to retry, by wrapping it using the `makeIdempotent` higher-order function.

The function wrapper takes a reference to the function to be made idempotent as first argument, and an object with options as second argument.

When you wrap your Lambda handler function, the utility uses the content of the `event` parameter to handle the idempotency logic.

```ts
import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context, APIGatewayProxyEvent } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const myHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<void> => {
  // your code goes here here
};

export const handler = makeIdempotent(myHandler, {
  persistenceStore,
});  
```

You can also use the `makeIdempotent` function to wrap any other arbitrary function, not just Lambda handlers.

```ts
import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context, SQSEvent, SQSRecord } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const processingFunction = async (payload: SQSRecord): Promise<void> => {
  // your code goes here here
};

const processIdempotently = makeIdempotent(processingFunction, {
  persistenceStore,
});

export const handler = async (
  event: SQSEvent,
  _context: Context
): Promise<void> => {
  for (const record of event.Records) {
    await processIdempotently(record);
  }
};
```

If your function has multiple arguments, you can use the `dataIndexArgument` option to specify which argument should be used as the idempotency key.

```ts
import { makeIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context, SQSEvent, SQSRecord } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const processingFunction = async (payload: SQSRecord, customerId: string): Promise<void> => {
  // your code goes here here
};

const processIdempotently = makeIdempotent(processingFunction, {
  persistenceStore,
  // this tells the utility to use the second argument (`customerId`) as the idempotency key
  dataIndexArgument: 1, 
});

export const handler = async (
  event: SQSEvent,
  _context: Context
): Promise<void> => {
  for (const record of event.Records) {
    await processIdempotently(record, 'customer-123');
  }
};
```

Note that you can also specify a JMESPath expression in the Idempotency config object to select a subset of the event payload as the idempotency key. This is useful when dealing with payloads that contain timestamps or request ids.

```ts
import { makeIdempotent, IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context, APIGatewayProxyEvent } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const myHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<void> => {
  // your code goes here here
};

export const handler = makeIdempotent(myHandler, {
  persistenceStore,
  config: new IdempotencyConfig({
    eventKeyJmespath: 'requestContext.identity.user',
  }),
});
```

Additionally, you can also use one of the [JMESPath built-in functions](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/jmespath/#built-in-jmespath-functions) like `powertools_json()` to decode keys and use parts of the payload as the idempotency key.

```ts
import { makeIdempotent, IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context, APIGatewayProxyEvent } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const myHandler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<void> => {
  // your code goes here here
};

export const handler = makeIdempotent(myHandler, {
  persistenceStore,
  config: new IdempotencyConfig({
    eventKeyJmespath: 'powertools_json(body).["user", "productId"]',
  }),
});
```

Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/) for more examples.

### Decorator

You can make any function idempotent, and safe to retry, by decorating it using the `@idempotent` decorator.

```ts
import { idempotent } from '@aws-lambda-powertools/idempotency';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context, APIGatewayProxyEvent } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

class MyHandler extends LambdaInterface {
  @idempotent({ persistenceStore: dynamoDBPersistenceLayer })
  public async handler(
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<void> {
    // your code goes here here
  }
}

const handlerClass = new MyHandler();
export const handler = handlerClass.handler.bind(handlerClass);
```

Using the same decorator, you can also make any other arbitrary method idempotent.

```ts
import { idempotent } from '@aws-lambda-powertools/idempotency';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import type { Context } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

class MyHandler extends LambdaInterface {
  
  public async handler(
    event: unknown,
    context: Context
  ): Promise<void> {
    for(const record of event.Records) {
      await this.processIdempotently(record);
    }
  }
  
  @idempotent({ persistenceStore: dynamoDBPersistenceLayer })
  private async process(record: unknown): Promise<void> {
    // process each code idempotently
  }
}

const handlerClass = new MyHandler();
export const handler = handlerClass.handler.bind(handlerClass);
```

The decorator configuration options are identical with the ones of the `makeIdempotent` function. Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/) for more examples.

### Middy middleware

If instead you use Middy, you can use the `makeHandlerIdempotent` middleware. When using the middleware your Lambda handler becomes idempotent.

By default, the Idempotency utility will use the full event payload to create an hash and determine if a request is idempotent, and therefore it should not be retried. When dealing with a more elaborate payload, where parts of the payload always change you should use the `IdempotencyConfig` object to instruct the utility to only use a portion of your payload. This is useful when dealing with payloads that contain timestamps or request ids.

```ts
import { IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import middy from '@middy/core';
import type { Context, APIGatewayProxyEvent } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});
const config = new IdempotencyConfig({
  hashFunction: 'md5',
  useLocalCache: false,
  expiresAfterSeconds: 3600,
  throwOnNoIdempotencyKey: false,
  eventKeyJmesPath: 'headers.idempotency-key',
});

export const handler = middy(
  async (_event: APIGatewayProxyEvent, _context: Context): Promise<void> => {
    // your code goes here here
  }
).use(
  makeHandlerIdempotent({
    config,
    persistenceStore,
  })
);
```

Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/) for more examples.

### DynamoDB persistence layer

You can use a DynamoDB Table to store the idempotency information. This enables you to keep track of the hash key, payload, status for progress, expiration, and much more.

You can customize most of the configuration options of the table, i.e the names of the attributes.
See the [API documentation](https://docs.powertools.aws.dev/lambda/typescript/latest/api/types/_aws_lambda_powertools_idempotency.types.DynamoDBPersistenceOptions.html) for more details.

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/aws-powertools/powertools-lambda-typescript/issues), or [creating new ones](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new/choose), in this GitHub repository.

## Connect

- **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
- **Email**: <aws-lambda-powertools-feedback@amazon.com>

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=customer-reference&template=support_powertools.yml&title=%5BSupport+Lambda+Powertools%5D%3A+%3Cyour+organization+name%3E) issue.

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

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/#lambda-layer), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
