---
title: Batch Processing
description: Utility
---

<!-- ???+ warning
	**This utility is currently released as beta developer preview** and is intended strictly for feedback and testing purposes **and not for production workloads**. The version and all future versions tagged with the `-beta` suffix should be treated as not stable. Up until before the [General Availability release](https://github.com/aws-powertools/powertools-lambda-typescript/milestone/14) we might introduce significant breaking changes and improvements in response to customers feedback. -->

???+ warning
	**This page refers to an unreleased utility that has yet to be published on the npm registry. Any version of the package built from source, as well as all future versions tagged with the `-alpha` suffix should be treated as experimental. Follow the [Beta release](https://github.com/aws-powertools/powertools-lambda-typescript/milestone/13) milestone for updates on the progress of this utility.**

The batch processing utility handles partial failures when processing batches from Amazon SQS, Amazon Kinesis Data Streams, and Amazon DynamoDB Streams.

## Key features

* Reports batch item failures to reduce number of retries for a record upon errors
* Simple interface to process each batch record
* Build your own batch processor by extending primitives

## Background

When using SQS, Kinesis Data Streams, or DynamoDB Streams as a Lambda event source, your Lambda functions are triggered with a batch of messages.

If your function fails to process any message from the batch, the entire batch returns to your queue or stream. This same batch is then retried until either condition happens first: **a)** your Lambda function returns a successful response, **b)** record reaches maximum retry attempts, or **c)** when records expire.

With this utility, batch records are processed individually – only messages that failed to be processed return to the queue or stream for a further retry. This works when two mechanisms are in place:

1. `ReportBatchItemFailures` is set in your SQS, Kinesis, or DynamoDB event source properties
2. [A specific response](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html#services-sqs-batchfailurereporting){target="_blank"} is returned so Lambda knows which records should not be deleted during partial responses

<!-- HTML tags are required in admonition content thus increasing line length beyond our limits -->
<!-- markdownlint-disable MD013 -->
???+ warning "Warning: This utility lowers the chance of processing records more than once; it does not guarantee it"
    We recommend implementing processing logic in an [idempotent manner](idempotency.md){target="_blank"} wherever possible.

    You can find more details on how Lambda works with either [SQS](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html){target="_blank"}, [Kinesis](https://docs.aws.amazon.com/lambda/latest/dg/with-kinesis.html){target="_blank"}, or [DynamoDB](https://docs.aws.amazon.com/lambda/latest/dg/with-ddb.html){target="_blank"} in the AWS Documentation.

## Getting started

Regardless whether you're using SQS, Kinesis Data Streams or DynamoDB Streams, you must configure your Lambda function event source to use `ReportBatchItemFailures`.

You do not need any additional IAM permissions to use this utility, except for what each event source requires.

### Required resources

The remaining sections of the documentation will rely on these samples. For completeness, this demonstrates IAM permissions and Dead Letter Queue where batch records will be sent after 2 retries were attempted.

=== "SQS"

    ```yaml title="template.yaml" hl_lines="30-31"
    --8<-- "docs/snippets/batch/templates/sam/sqs.yaml"
    ```

=== "Kinesis Data Streams"

    ```yaml title="template.yaml" hl_lines="44-45"
    --8<-- "docs/snippets/batch/templates/sam/kinesis.yaml"
    ```

=== "DynamoDB Streams"

    ```yaml title="template.yaml" hl_lines="43-44"
    --8<-- "docs/snippets/batch/templates/sam/dynamodb.yaml"
    ```

### Processing messages from SQS

Processing batches from SQS works in three stages:

1. Instantiate **`BatchProcessor`** and choose **`EventType.SQS`** for the event type
2. Define your function to handle each batch record, and use the `SQSRecord` type annotation for autocompletion
3. Use **`processPartialResponse`** to kick off processing

???+ info
    This code example optionally uses Logger for completion.

=== "index.ts"

    ```typescript hl_lines="1-5 14 17 29-31"
    --8<-- "docs/snippets/batch/gettingStartedSQS.ts::32"
    ```

=== "Sample response"

    The second record failed to be processed, therefore the processor added its message ID in the response.

    ```json
    --8<-- "docs/snippets/batch/samples/sampleSQSResponse.json"
    ```

=== "Sample event"

    ```json
    --8<-- "docs/snippets/batch/samples/sampleSQSEvent.json"
    ```

#### FIFO queues

When using [SQS FIFO queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html){target="_blank"}, we will stop processing messages after the first failure, and return all failed and unprocessed messages in `batchItemFailures`.
This helps preserve the ordering of messages in your queue.

```typescript hl_lines="1-4 13 28-30"
--8<-- "docs/snippets/batch/gettingStartedSQSFifo.ts"
```

### Processing messages from Kinesis

Processing batches from Kinesis works in three stages:

1. Instantiate **`BatchProcessor`** and choose **`EventType.KinesisDataStreams`** for the event type
2. Define your function to handle each batch record, and use the `KinesisStreamRecord` type annotation for autocompletion
3. Use **`processPartialResponse`** to kick off processing

???+ info
    This code example optionally uses Logger for completion.

=== "index.ts"

    ```typescript hl_lines="1-5 14 17 27-29"
    --8<-- "docs/snippets/batch/gettingStartedKinesis.ts"
    ```

=== "Sample response"

    The second record failed to be processed, therefore the processor added its sequence number in the response.

    ```json
    --8<-- "docs/snippets/batch/samples/sampleKinesisEvent.json"
    ```

=== "Sample event"

    ```json
    --8<-- "docs/snippets/batch/samples/sampleKinesisResponse.json"
    ```

### Processing messages from DynamoDB

Processing batches from DynamoDB Streams works in three stages:

1. Instantiate **`BatchProcessor`** and choose **`EventType.DynamoDBStreams`** for the event type
2. Define your function to handle each batch record, and use the `DynamoDBRecord` type annotation for autocompletion
3. Use **`processPartialResponse`** to kick off processing

???+ info
    This code example optionally uses Logger for completion.

=== "index.ts"

    ```typescript hl_lines="1-5 14 17 32-34"
    --8<-- "docs/snippets/batch/gettingStartedDynamoDBStreams.ts"
    ```

=== "Sample response"

    The second record failed to be processed, therefore the processor added its sequence number in the response.

    ```json
    --8<-- "docs/snippets/batch/samples/sampleDynamoDBStreamsResponse.json"
    ```

=== "Sample event"

    ```json
    --8<-- "docs/snippets/batch/samples/sampleDynamoDBStreamsEvent.json"
    ```

### Partial failure mechanics

All records in the batch will be passed to this handler for processing, even if exceptions are thrown - Here's the behaviour after completing the batch:

* **All records successfully processed**. We will return an empty list of item failures `{'batchItemFailures': []}`
* **Partial success with some exceptions**. We will return a list of all item IDs/sequence numbers that failed processing
* **All records failed to be processed**. We will raise `BatchProcessingError` exception with a list of all exceptions raised when processing

### Processing messages asynchronously

You can use `AsyncBatchProcessor` class and `asyncProcessPartialResponse` function to process messages concurrently.

???+ question "When is this useful?"
    Your use case might be able to process multiple records at the same time without conflicting with one another.

    For example, imagine you need to process multiple loyalty points and incrementally save in a database. While you await the database to confirm your records are saved, you could start processing another request concurrently.

    The reason this is not the default behaviour is that not all use cases can handle concurrency safely (e.g., loyalty points must be updated in order).

```typescript hl_lines="1-5 14 28-30" title="High-concurrency with AsyncBatchProcessor"
--8<-- "docs/snippets/batch/gettingStartedAsync.ts"
```

## Advanced

### Accessing processed messages

Use the `BatchProcessor` directly in your function to access a list of all returned values from your `recordHandler` function.

* **When successful**. We will include a tuple with `success`, the result of `recordHandler`, and the batch record
* **When failed**. We will include a tuple with `fail`, exception as a string, and the batch record

```typescript hl_lines="27-28 30-32 37" title="Accessing processed messages"
--8<-- "docs/snippets/batch/accessProcessedMessages.ts"
```

### Accessing Lambda Context

Within your `recordHandler` function, you might need access to the Lambda context to determine how much time you have left before your function times out.

We can automatically inject the [Lambda context](https://docs.aws.amazon.com/lambda/latest/dg/typescript-context.html){target="_blank"} into your `recordHandler` as optional second argument if you register it when using `BatchProcessor` or the `processPartialResponse` function.

```typescript hl_lines="17 35"
--8<-- "docs/snippets/batch/accessLambdaContext.ts"
```

### Extending BatchProcessor

You might want to bring custom logic to the existing `BatchProcessor` to slightly override how we handle successes and failures.

For these scenarios, you can subclass `BatchProcessor` and quickly override `successHandler` and `failureHandler` methods:

* **`successHandler()`** – Keeps track of successful batch records
* **`failureHandler()`** – Keeps track of failed batch records

???+ example
	Let's suppose you'd like to add a metric named `BatchRecordFailures` for each batch record that failed processing

```typescript hl_lines="5-6 17-33 35 50-52" title="Extending failure handling mechanism in BatchProcessor"
--8<-- "docs/snippets/batch/extendingFailure.ts"
```

### Create your own partial processor

You can create your own partial batch processor from scratch by inheriting the `BasePartialProcessor` class, and implementing the `prepare()`, `clean()`, `processRecord()` and `asyncProcessRecord()` abstract methods.

* **`processRecord()`** – handles all processing logic for each individual message of a batch, including calling the `recordHandler` (`this.handler`)
* **`prepare()`** – called once as part of the processor initialization
* **`clean()`** – teardown logic called once after `processRecord` completes
* **`asyncProcessRecord()`** – If you need to implement asynchronous logic, use this method, otherwise define it in your class with empty logic

You can then use this class as a context manager, or pass it to `processPartialResponse` to process the records in your Lambda handler function.

```typescript hl_lines="7 11-13 19 28 39 60 71 82 92-94" title="Creating a custom batch processor"
--8<-- "docs/snippets/batch/customPartialProcessor.ts"
```

## Testing your code

As there is no external calls, you can unit test your code with `BatchProcessor` quite easily.

**Example**:

Given a SQS batch where the first batch record succeeds and the second fails processing, we should have a single item reported in the function response.

=== "index.test.ts"

    ```typescript
    --8<-- "docs/snippets/batch/testingYourCode.ts"
    ```

=== "index.ts"

    ```typescript
    --8<-- "docs/snippets/batch/gettingStartedSQS.ts"
    ```

=== "Sample SQS event"

    ```json title="events/sqs_event.json"
    --8<-- "docs/snippets/batch/samples/sampleSQSEvent.json"
    ```