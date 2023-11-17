/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { KinesisDataStreamSchema } from '../../../src/schemas/kinesis';
import {
  KinesisFirehoseSchema,
  KinesisFirehoseSqsSchema,
} from '../../../src/schemas/kinesis-firehose';
import { loadExampleEvent } from './utils';
import { extractCloudWatchLogFromEvent } from '../../../src/schemas/cloudwatch';

describe('Kinesis ', () => {
  it('should parse kinesis event', () => {
    const kinesisStreamEvent = loadExampleEvent('kinesisStreamEvent.json');
    const parsed = KinesisDataStreamSchema.parse(kinesisStreamEvent);
    const decodedData = Buffer.from(
      parsed.Records[0].kinesis.data,
      'base64'
    ).toString('utf8');
    expect(decodedData).toEqual('Hello, this is a test.');
  });
  it('should prase single kinesis record', () => {
    const kinesisStreamEventOneRecord = loadExampleEvent(
      'kinesisStreamEventOneRecord.json'
    );
    const parsed = KinesisDataStreamSchema.parse(kinesisStreamEventOneRecord);
    const decodedJson = JSON.parse(
      Buffer.from(parsed.Records[0].kinesis.data, 'base64').toString('utf8')
    );
    expect(decodedJson).toEqual({
      message: 'test message',
      username: 'test',
    });
  });
  it('should parse Firehose event', () => {
    const kinesisFirehoseKinesisEvent = loadExampleEvent(
      'kinesisFirehoseKinesisEvent.json'
    );
    const parsed = KinesisFirehoseSchema.parse(kinesisFirehoseKinesisEvent);
    expect(parsed.records[0].data).toEqual('Hello World');
  });
  it('should parse Kinesis Firehose PutEvents event', () => {
    const kinesisFirehosePutEvent = loadExampleEvent(
      'kinesisFirehosePutEvent.json'
    );
    const parsed = KinesisFirehoseSchema.parse(kinesisFirehosePutEvent);
    expect(JSON.parse(parsed.records[1].data)).toEqual({
      Hello: 'World',
    });
  });
  it('should parse Firehose event with SQS event', () => {
    const kinesisFirehoseSQSEvent = loadExampleEvent(
      'kinesisFirehoseSQSEvent.json'
    );
    const parsed = KinesisFirehoseSqsSchema.parse(kinesisFirehoseSQSEvent);
    console.log(parsed.records[0].data);
    expect(parsed.records[0].data).toMatchObject({
      messageId: '5ab807d4-5644-4c55-97a3-47396635ac74',
      body: 'Test message.',
    });
  });
  it('should parse Firehose event with CloudWatch event', () => {
    const kinesisStreamCloudWatchLogsEvent = loadExampleEvent(
      'kinesisStreamCloudWatchLogsEvent.json'
    );
    const parsed = KinesisDataStreamSchema.parse(
      kinesisStreamCloudWatchLogsEvent
    );

    const jsonParsed = extractCloudWatchLogFromEvent(
      parsed.Records[0].kinesis.data
    );
    expect(jsonParsed).toMatchObject({
      messageType: 'DATA_MESSAGE',
      owner: '231436140809',
      logGroup: '/aws/lambda/pt-1488-DummyLogDataFunction-gnWXPvL6jJyG',
      logStream: '2022/11/10/[$LATEST]26b6a45d574f442ea28438923cbf7bf7',
    });
  });
  it('should return original value if cannot parse KinesisFirehoseSqsRecord', () => {
    const kinesisFirehoseSQSEvent = loadExampleEvent(
      'kinesisFirehoseSQSEvent.json'
    );
    kinesisFirehoseSQSEvent.records[0].data = 'not a valid json';
    const parsed = KinesisFirehoseSqsSchema.parse(kinesisFirehoseSQSEvent);
    expect(parsed.records[0].data).toEqual('not a valid json');
  });
});
