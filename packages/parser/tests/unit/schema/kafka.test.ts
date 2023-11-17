/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import {
  KafkaMskEventSchema,
  KafkaSelfManagedEventSchema,
} from '../../../src/schemas/kafka';
import { loadExampleEvent } from './utils';

describe('Kafka ', () => {
  const expectedTestEvent = {
    key: 'recordKey',
    value: JSON.stringify({ key: 'value' }),
    partition: 0,
    topic: 'mytopic',
    offset: 15,
    timestamp: 1545084650987,
    timestampType: 'CREATE_TIME',
    headers: [
      {
        headerKey: 'headerValue',
      },
    ],
  };
  it('should parse kafka MSK event', () => {
    const kafkaEventMsk = loadExampleEvent('kafkaEventMsk.json');
    expect(
      KafkaMskEventSchema.parse(kafkaEventMsk).records['mytopic-0'][0]
    ).toEqual(expectedTestEvent);
  });
  it('should parse kafka self managed event', () => {
    const kafkaEventSelfManaged = loadExampleEvent(
      'kafkaEventSelfManaged.json'
    );
    expect(
      KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged).records[
        'mytopic-0'
      ][0]
    ).toEqual(expectedTestEvent);
  });
  it('should transform bootstrapServers to array', () => {
    const kafkaEventSelfManaged = loadExampleEvent(
      'kafkaEventSelfManaged.json'
    );
    expect(
      KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged).bootstrapServers
    ).toEqual([
      'b-2.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092',
      'b-1.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092',
    ]);
  });
  it('should return undefined if bootstrapServers is not present', () => {
    const kafkaEventSelfManaged = loadExampleEvent(
      'kafkaEventSelfManaged.json'
    ) as { bootstrapServers: string };
    kafkaEventSelfManaged.bootstrapServers = '';
    const parsed = KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged);
    expect(parsed.bootstrapServers).toBeUndefined();
  });
});
