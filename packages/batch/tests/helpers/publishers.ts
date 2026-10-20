import { SendMessageBatchCommand, SQSClient } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({});

/**
 * Send a batch of messages to an SQS queue.
 *
 * @param queueUrl - The URL of the SQS queue
 * @param messages - An array of messages to send, each with a message body and a failure flag
 */
const sendMessagesToQueue = async (
  queueUrl: string,
  messages: Record<string, unknown>[]
) => {
  await sqsClient.send(
    new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: messages.map((message, index) => ({
        Id: `msg-${index}`,
        MessageBody: JSON.stringify(message),
      })),
    })
  );
};

export { sendMessagesToQueue };
