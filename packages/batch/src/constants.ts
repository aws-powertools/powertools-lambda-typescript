enum EventType {
  SQS = 'SQS',
  KinesisDataStreams = 'KinesisDataStreams',
  DynamoDBStreams = 'DynamoDBStreams',
}

const DEFAULT_RESPONSE: { [key: string]: { [key: string]: string }[] } = {
  batchItemFailures: [],
};

export { EventType, DEFAULT_RESPONSE };
