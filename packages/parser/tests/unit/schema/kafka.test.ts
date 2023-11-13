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
    const parsed = KafkaMskEventSchema.parse(kafkaEventMsk);

    expect(parsed.records['mytopic-0'][0]).toEqual(expectedTestEvent);
  });
  it('should parse kafka self managed event', () => {
    const parsed = KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged);
    expect(parsed.records['mytopic-0'][0]).toEqual(expectedTestEvent);
  });
});
