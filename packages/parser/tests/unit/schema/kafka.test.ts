/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import {
  KafkaMskEventSchema,
  KafkaSelfManagedEventSchema,
} from '../../../src/schemas/kafka';
import kafkaEventMsk from '../../events/kafkaEventMsk.json';
import kafkaEventSelfManaged from '../../events/kafkaEventSelfManaged.json';

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
    expect(
      KafkaMskEventSchema.parse(kafkaEventMsk).records['mytopic-0'][0]
    ).toEqual(expectedTestEvent);
  });
  it('should parse kafka self managed event', () => {
    expect(
      KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged).records[
        'mytopic-0'
      ][0]
    ).toEqual(expectedTestEvent);
  });
  it('should transform bootstrapServers to array', () => {
    expect(
      KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged).bootstrapServers
    ).toEqual([
      'b-2.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092',
      'b-1.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092',
    ]);
  });
  it('should return undefined if bootstrapServers is not present', () => {
    kafkaEventSelfManaged.bootstrapServers = '';
    const parsed = KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged);
    expect(parsed.bootstrapServers).toBeUndefined();
  });
});
