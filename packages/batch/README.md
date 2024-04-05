# Powertools for AWS Lambda (TypeScript) - Batch Processing Utility <!-- omit in toc -->

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the package in both TypeScript and JavaScript code bases.

- [Intro](#intro)
- [Key features](#key-features)
- [Usage](#usage)
  - [Batch Processor](#batch-processor)
  - [SQS Processor](#sqs-processor)
  - [Kinesis Processor](#kinesis-processor)
  - [DynamoDB Streams Processor](#dynamodb-streams-processor)
  - [Async processing](#async-processing)
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

The batch processing utility handles partial failures when processing batches from Amazon SQS, Amazon Kinesis Data Streams, and Amazon DynamoDB Streams.

## Key features

* Reports batch item failures to reduce number of retries for a record upon errors
* Simple interface to process each batch record
* Build your own batch processor by extending primitives

## Usage

To get started, install the library by running:

```sh
npm install @aws-lambda-powertools/batch
```

### Batch Processor

When using SQS, Kinesis Data Streams, or DynamoDB Streams as a Lambda event source, your Lambda functions are triggered with a batch of messages.

If your function fails to process any message from the batch, the entire batch returns to your queue or stream. This same batch is then retried until either condition happens first: **a)** your Lambda function returns a successful response, **b)** record reaches maximum retry attempts, or **c)** when records expire.

With this utility, batch records are processed individually – only messages that failed to be processed return to the queue or stream for a further retry.

### SQS Processor

When using SQS as a Lambda event source, you can specify the `EventType.SQS` to process the records. The response will be a `SQSBatchResponse` which contains a list of items that failed to be processed.

```ts
import {
  BatchProcessorSync,
  EventType,
  processPartialResponseSync,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  SQSEvent,
  SQSRecord,
  Context,
  SQSBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessorSync(EventType.SQS);
const logger = new Logger();

const recordHandler = (record: SQSRecord): void => {
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  }
};

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  return processPartialResponseSync(event, recordHandler, processor, {
    context,
  });
};
export { processor };
```

### Kinesis Processor

When using Kinesis Data Streams as a Lambda event source, you can specify the `EventType.KinesisDataStreams` to process the records. The response will be a `KinesisStreamBatchResponse` which contains a list of items that failed to be processed.

```ts
import {
  BatchProcessorSync,
  EventType,
  processPartialResponseSync,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  KinesisStreamEvent,
  KinesisStreamRecord,
  Context,
  KinesisStreamBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessorSync(EventType.KinesisDataStreams);
const logger = new Logger();

const recordHandler = (record: KinesisStreamRecord): void => {
  logger.info('Processing record', { record: record.kinesis.data });
  const payload = JSON.parse(record.kinesis.data);
  logger.info('Processed item', { item: payload });
};

export const handler = async (
  event: KinesisStreamEvent,
  context: Context
): Promise<KinesisStreamBatchResponse> => {
  return processPartialResponseSync(event, recordHandler, processor, {
    context,
  });
};
```

### DynamoDB Streams Processor

When using DynamoDB Streams as a Lambda event source, you can use the `BatchProcessorSync` with the `EventType.DynamoDBStreams` to process the records. The response will be a `DynamoDBBatchResponse` which contains a list of items that failed to be processed.

```ts
import {
  BatchProcessorSync,
  EventType,
  processPartialResponseSync,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type {
  DynamoDBStreamEvent,
  DynamoDBRecord,
  Context,
  DynamoDBBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessorSync(EventType.DynamoDBStreams);
const logger = new Logger();

const recordHandler = (record: DynamoDBRecord): void => {
  if (record.dynamodb && record.dynamodb.NewImage) {
    logger.info('Processing record', { record: record.dynamodb.NewImage });
    const message = record.dynamodb.NewImage.Message.S;
    if (message) {
      const payload = JSON.parse(message);
      logger.info('Processed item', { item: payload });
    }
  }
};

export const handler = async (
  event: DynamoDBStreamEvent,
  context: Context
): Promise<DynamoDBBatchResponse> => {
  return processPartialResponseSync(event, recordHandler, processor, {
    context,
  });
};
```

### Async processing

If your use case allows you to process multiple records at the same time without conflicting with each other, you can use the `BatchProcessor` to process records asynchronously. This will create an array of promises that will be resolved once all records have been processed.

```ts
import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type {
  SQSEvent,
  SQSRecord,
  Context,
  SQSBatchResponse,
} from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);

const recordHandler = async (record: SQSRecord): Promise<number> => {
  const res = await fetch('https://httpbin.org/anything', {
    body: JSON.stringify({ message: record.body }),
  });

  return res.status;
};

export const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  return await processPartialResponse(event, recordHandler, processor, {
    context,
  });
};
```

Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/utilities/batch/) for more examples.

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
* [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
* [AppYourself](https://appyourself.net)
* [Alma Media](https://www.almamedia.fi)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has already shared about Powertools for AWS Lambda (TypeScript) [here](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/#lambda-layer), you can add Powertools as a dev dependency (or as part of your virtual env) to not impact the development process.

## Credits

Credits for the Lambda Powertools for AWS Lambda (TypeScript) idea go to [DAZN](https://github.com/getndazn) and their [DAZN Lambda Powertools](https://github.com/getndazn/dazn-lambda-powertools/).

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
