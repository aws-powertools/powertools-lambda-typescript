# Powertools for AWS Lambda (TypeScript) - Idempotency Utility <!-- omit in toc -->


| ⚠️ **WARNING: Do not use this utility in production just yet!** ⚠️                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **This utility is currently released as beta developer preview** and is intended strictly for feedback and testing purposes **and not for production workloads**.. The version and all future versions tagged with the `-beta` suffix should be treated as not stable. Up until before the [General Availability release](https://github.com/aws-powertools/powertools-lambda-typescript/milestone/10) we might introduce significant breaking changes and improvements in response to customers feedback. | _ |


Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda-typescript/latest/#features).

You can use the package in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Key features](#key-features)
- [Usage](#usage)
  - [Function wrapper](#function-wrapper)
  - [Middy middleware](#middy-middleware)
  - [DynamoDB persistence layer](#dynamodb-persistence-layer)
- [Contribute](#contribute)
- [Roadmap](#roadmap)
- [Connect](#connect)
- [How to support Powertools for AWS Lambda (TypeScript)?](#how-to-support-powertools-for-aws-lambda-typescript)
  - [Becoming a reference customer](#becoming-a-reference-customer)
  - [Sharing your work](#sharing-your-work)
  - [Using Lambda Layer](#using-lambda-layer)
- [Credits](#credits)
- [License](#license)

## Intro

This package provides a utility to implement idempotency in your Lambda functions. 
You can either use it to wrapp a function, or as Middy middleware to make your AWS Lambda handler idempotent.

The current implementation provides a persistence layer for Amazon DynamoDB, which offers a variety of configuration options. You can also bring your own persistence layer by extending the `BasePersistenceLayer` class.

## Key features

* Prevent Lambda handler from executing more than once on the same event payload during a time window
* Ensure Lambda handler returns the same result when called with the same payload
* Select a subset of the event as the idempotency key using JMESPath expressions
* Set a time window in which records with the same payload should be considered duplicates
* Expires in-progress executions if the Lambda function times out halfway through 

## Usage

To get started, install the library by running:

```sh
npm install @aws-lambda-powertools/idempotency
```

Next, review the IAM permissions attached to your AWS Lambda function and make sure you allow the [actions detailed](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/#iam-permissions) in the documentation of the utility.

### Function wrapper

You can make any function idempotent, and safe to retry, by wrapping it using the `makeFunctionIdempotent` higher-order function.

The function wrapper takes a reference to the function to be made idempotent as first argument, and an object with options as second argument.

```ts
import { makeFunctionIdempotent } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/persistence';
import type { Context, SQSEvent, SQSRecord } from 'aws-lambda';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'idempotencyTableName',
});

const processingFunction = async (payload: SQSRecord): Promise<void> => {
  // your code goes here here
};

export const handler = async (
  event: SQSEvent,
  _context: Context
): Promise<void> => {
  for (const record of event.Records) {
    await makeFunctionIdempotent(proccessingFunction, {
      dataKeywordArgument: 'transactionId',
      persistenceStore,
    });
  }
};
```

Note that we are specifying a `dataKeywordArgument` option, this tells the Idempotency utility which field(s) will be used as idempotency key.

Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/idempotency/) for more examples.

### Middy middleware

If instead you use Middy, you can use the `makeHandlerIdempotent` middleware. When using the middleware your Lambda handler becomes idempotent.

By default, the Idempotency utility will use the full event payload to create an hash and determine if a request is idempotent, and therefore it should not be retried. When dealing with a more elaborate payload, where parts of the payload always change you should use the `IdempotencyConfig` object to instruct the utility to only use a portion of your payload. This is useful when dealing with payloads that contain timestamps or request ids.

```ts
import { IdempotencyConfig } from '@aws-lambda-powertools/idempotency';
import { makeHandlerIdempotent } from '@aws-lambda-powertools/idempotency/middleware';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/persistence';
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

const processingFunction = async (payload: SQSRecord): Promise<void> => {
  // your code goes here here
};

export const handler = middy(
  async (event: APIGatewayProxyEvent, _context: Context): Promise<void> => {
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

* **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
* **Email**: aws-lambda-powertools-feedback@amazon.com

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=customer-reference&template=support_powertools.yml&title=%5BSupport+Lambda+Powertools%5D%3A+%3Cyour+organization+name%3E) issue.

The following companies, among others, use Powertools:

* [Hashnode](https://hashnode.com/)
* [Trek10](https://www.trek10.com/)
* [Elva](https://elva-group.com)
* [globaldatanet](https://globaldatanet.com/)
* [Bailey Nelson](https://www.baileynelson.com.au)
* [Perfect Post](https://www.perfectpost.fr)
* [Sennder](https://sennder.com/)
* [Certible](https://www.certible.com/)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://docs.powertools.aws.dev/lambda-typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](#lambda-layers), you can add Powertools as a dev dependency (or as part of your virtual env) to not impact the development process.

## Credits

Credits for the Lambda Powertools for AWS Lambda (TypeScript) idea go to [DAZN](https://github.com/getndazn) and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/).

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
