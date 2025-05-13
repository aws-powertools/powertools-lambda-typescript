# Powertools for AWS Lambda (TypeScript) - Batch Processing Utility

Powertools for AWS Lambda (TypeScript) is a developer toolkit to implement Serverless [best practices and increase developer velocity](https://docs.powertools.aws.dev/lambda/typescript/latest/#features).

You can use the library in both TypeScript and JavaScript code bases.

## Intro

The Batch Processing utility handles partial failures when processing batches from Amazon SQS, Amazon Kinesis Data Streams, and Amazon DynamoDB Streams.

## Usage

To get started, install the library by running:

```sh
npm i @aws-lambda-powertools/batch
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
import type { SQSHandler, SQSRecord } from 'aws-lambda';

const processor = new BatchProcessorSync(EventType.SQS);
const logger = new Logger();

const recordHandler = (record: SQSRecord): void => {
  const payload = record.body;
  if (payload) {
    const item = JSON.parse(payload);
    logger.info('Processed item', { item });
  }
};

export const handler: SQSHandler = async (event, context) => 
  processPartialResponseSync(event, recordHandler, processor, {
    context,
  });
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
import type { KinesisStreamHandler, KinesisStreamRecord } from 'aws-lambda';

const processor = new BatchProcessorSync(EventType.KinesisDataStreams);
const logger = new Logger();

const recordHandler = (record: KinesisStreamRecord): void => {
  logger.info('Processing record', { record: record.kinesis.data });
  const payload = JSON.parse(record.kinesis.data);
  logger.info('Processed item', { item: payload });
};

export const handler: KinesisStreamHandler = async (event, context) => 
  processPartialResponseSync(event, recordHandler, processor, {
    context,
  });
```

### DynamoDB Streams Processor

When using DynamoDB Streams as a Lambda event source, you can use the `BatchProcessorSync` with the `EventType.DynamoDBStreams` to process the records. The response will be a `DynamoDBBatchResponse` which contains a list of items that failed to be processed.

```ts
import {
  BatchProcessor,
  EventType,
  processPartialResponseSync,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
import type { DynamoDBRecord, DynamoDBStreamHandler } from 'aws-lambda';

const processor = new BatchProcessor(EventType.DynamoDBStreams); // (1)!
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

export const handler: DynamoDBStreamHandler = async (event, context) =>
  processPartialResponseSync(event, recordHandler, processor, {
    context,
  });
```

### Async processing

If your use case allows you to process multiple records at the same time without conflicting with each other, you can use the `BatchProcessor` to process records asynchronously. This will create an array of promises that will be resolved once all records have been processed.

```ts
import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import type { SQSHandler, SQSRecord } from 'aws-lambda';

const processor = new BatchProcessor(EventType.SQS);

const recordHandler = async (record: SQSRecord): Promise<number> => {
  const res = await fetch('https://httpbin.org/anything', {
    body: JSON.stringify({ message: record.body }),
  });

  return res.status;
};

export const handler: SQSHandler = async (event, context) => 
  await processPartialResponse(event, recordHandler, processor, {
    context,
  });
```

Check the [docs](https://docs.powertools.aws.dev/lambda/typescript/latest/features/batch/) for more examples.

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

Knowing which companies are using this library is important to help prioritize the project internally. If your company is using Powertools for AWS Lambda (TypeScript), you can request to have your name and logo added to the README file by raising a [Support Powertools for AWS Lambda (TypeScript) (become a reference)](https://s12d.com/become-reference-pt-ts) issue.

The following companies, among others, use Powertools:

- [Alma Media](https://www.almamedia.fi)
- [AppYourself](https://appyourself.net)
- [Bailey Nelson](https://www.baileynelson.com.au)
- [Banxware](https://www.banxware.com)
- [Caylent](https://caylent.com/)
- [Certible](https://www.certible.com/)
- [Elva](https://elva-group.com)
- [Flyweight](https://flyweight.io/)
- [globaldatanet](https://globaldatanet.com/)
- [Guild](https://guild.com)
- [Hashnode](https://hashnode.com/)
- [LocalStack](https://localstack.cloud/)
- [Ours Privacy](https://oursprivacy.com/)
- [Perfect Post](https://www.perfectpost.fr)
- [Sennder](https://sennder.com/)
- [tecRacer GmbH & Co. KG](https://www.tecracer.com/)
- [Trek10](https://www.trek10.com/)
- [WeSchool](https://www.weschool.com)

### Sharing your work

Share what you did with Powertools for AWS Lambda (TypeScript) 💞💞. Blog post, workshops, presentation, sample apps and others. Check out what the community has [already shared](https://docs.powertools.aws.dev/lambda/typescript/latest/we_made_this) about Powertools for AWS Lambda (TypeScript).

### Using Lambda Layer

This helps us understand who uses Powertools for AWS Lambda (TypeScript) in a non-intrusive way, and helps us gain future investments for other Powertools for AWS Lambda languages. When [using Layers](https://docs.powertools.aws.dev/lambda/typescript/latest/getting-started/lambda-layers/), you can add Powertools as a dev dependency to not impact the development process.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
