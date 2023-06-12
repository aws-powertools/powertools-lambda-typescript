# Powertools for AWS Lambda (TypeScript) - Idempotency Utility <!-- omit in toc -->


| ⚠️ **WARNING: Do not use this utility in production just yet!** ⚠️                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **This utility is currently released as beta developer preview** and is intended strictly for feedback and testing purposes **and not for production workloads**.. The version and all future versions tagged with the `-beta` suffix should be treated as not stable. Up until before the [General Availability release](https://github.com/awslabs/aws-lambda-powertools-typescript/milestone/10) we might introduce significant breaking changes and improvements in response to customers feedback. | _ |


Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/#features).

## Intro

This package provides a utility to implement idempotency in your Lambda functions. 
You can either use it as a decorator on your Lambda handler or as a wrapper on any other function.
If you use middy, we also provide a middleware to make your Lambda handler idempotent.
The current implementation provides a persistance layer for Amazon DynamoDB, which offers a variety of configuration options. 
You can also bring your own persistance layer by implementing the `IdempotencyPersistanceLayer` interface.

## Key features
* Prevent Lambda handler from executing more than once on the same event payload during a time window
* Ensure Lambda handler returns the same result when called with the same payload
* Select a subset of the event as the idempotency key using JMESPath expressions
* Set a time window in which records with the same payload should be considered duplicates
* Expires in-progress executions if the Lambda function times out halfway through 

## Usage

### Decorators
If you use classes to define your Lambda handlers, you can use the decorators to make your handler idempotent or a specific function idempotent.
We offer two decorators: 
* `@idempotentLambdaHandler`: makes the handler idempotent. 
* `@idempotentFunction`: makes any function within your class idempotent

The first can only be applied to the handler function with the specific signature of a Lambda handler.
The second can be applied to any function within your class. In this case you need to pass a `Record` object and provide the `dataKeywordArgument` parameter to specify the name of the argument that contains the data to be used as the idempotency key.
In any of both cases yoiu need to pass the persistance layer where we will store the idempotency information.


### Function wrapper

A more common approach is to use the function wrapper. 
Similar to `@idempotentFunction` decorator you need to pass keyword argument to indicate which part of the payload will be hashed. 

### Middy middleware
// TODO: after e2e tests are implemented

### DynamoDB peristance layer
To store the idempotency information offer a DynamoDB persistance layer. 
This enables you to store the hash key, payload, status for progress and expiration and much more. 
You can customise most of the configuration options of the DynamoDB table, i.e the names of the attributes.
See the [API documentation](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/modules/.index.DynamoDBPersistenceLayer.html) for more details.

## Examples

### Decorator Lambda handler

```ts
import { idempotentLambdaHandler } from "@aws-lambda-powertools/idempotency";
import { DynamoDBPersistenceLayer } from "@aws-lambda-powertools/idempotency/persistance";
import type { Context } from 'aws-lambda';

const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer();

class MyLambdaHandler implements LambdaInterface {
  @idempotentLambdaHandler({ persistenceStore: dynamoDBPersistenceLayer })
  public async handler(_event: any, _context: Context): Promise<string> {
    // your lambda code here
    return "Hello World";
  }
}

const lambdaClass = new MyLambdaHandler();
export const handler = lambdaClass.handler.bind(lambdaClass);
```

### Decorator function

```ts
import { idempotentLambdaHandler } from "@aws-lambda-powertools/idempotency";
import { DynamoDBPersistenceLayer } from "@aws-lambda-powertools/idempotency/persistance";
import type { Context } from 'aws-lambda';


const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer();

class MyLambdaHandler implements LambdaInterface {
  
  public async handler(_event: any, _context: Context): Promise<void> {
    for(const record of _event.Records) {
      await this.processRecord(record);
    }
  }
  
  @idempotentFunction({ persistenceStore: dynamoDBPersistenceLayer, dataKeywordArgument: "payload" })
  public async process(payload: Record<string, unknown>): Promise<void> {
    // your lambda code here
  }
}
```

The `dataKeywordArgument` parameter is optional. If not provided, the whole event will be used as the idempotency key.
Otherwise, you need to specify the string name of the argument that contains the data to be used as the idempotency key.
For example if you have an input like this:


```json
{
  "transactionId": 1235,
  "product": "book",
  "quantity": 1,
  "price": 10
}
```

You can use `transactionId` as the idempotency key. This will ensure that the same transaction is not processed twice.

### Function wrapper

In case where you don't use classes and decorators you can wrap your function to make it idempotent.

```ts
import { makeFunctionIdempotent } from "@aws-lambda-powertools/idempotency";
import { DynamoDBPersistenceLayer } from "@aws-lambda-powertools/idempotency/persistance";
import type { Context } from 'aws-lambda';


const dynamoDBPersistenceLayer = new DynamoDBPersistenceLayer();
const processingFunction = async (payload: Record<string, unknown>): Promise<void> => {
  // your lambda code here
};

const processIdempotently = makeFunctionIdempotent(proccessingFunction, {
  persistenceStore: dynamoDBPersistenceLayer,
  dataKeywordArgument: "transactionId"
});

export const handler = async (
  _event: any,
  _context: Context
): Promise<void> => {
  for (const record of _event.Records) {
    await processIdempotently(record);
  }
};
```

## Contribute

If you are interested in contributing to this project, please refer to our [Contributing Guidelines](https://github.com/awslabs/aws-lambda-powertools-typescript/blob/main/CONTRIBUTING.md).

## Roadmap

The roadmap of Powertools for AWS Lambda (TypeScript) is driven by customers’ demand.  
Help us prioritize upcoming functionalities or utilities by [upvoting existing RFCs and feature requests](https://github.com/awslabs/aws-lambda-powertools-typescript/issues), or [creating new ones](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/new/choose), in this GitHub repository.

## Connect

* **Powertools for AWS Lambda on Discord**: `#typescript` - **[Invite link](https://discord.gg/B8zZKbbyET)**
* **Email**: aws-lambda-powertools-feedback@amazon.com

## How to support Powertools for AWS Lambda (TypeScript)?

### Becoming a reference customer

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/new?assignees=&labels=customer-reference&template=support_powertools.yml&title=%5BSupport+Lambda+Powertools%5D%3A+%3Cyour+organization+name%3E) issue.

The following companies, among others, use Powertools:

* [Hashnode](https://hashnode.com/)
* [Trek10](https://www.trek10.com/)
* [Elva](https://elva-group.com)
* [globaldatanet](https://globaldatanet.com/)
* [Bailey Nelson](https://www.baileynelson.com.au)
* [Perfect Post](https://www.perfectpost.fr)
* [Sennder](https://sennder.com/)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](#lambda-layers), you can add Powertools as a dev dependency (or as part of your virtual env) to not impact the development process.

## Credits

Credits for the Lambda Powertools for AWS Lambda (TypeScript) idea go to [DAZN](https://github.com/getndazn) and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/).

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
