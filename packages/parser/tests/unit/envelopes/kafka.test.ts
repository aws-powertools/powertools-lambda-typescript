/**
 * Test built in schema envelopes for api gateway v2
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { MSKEvent, SelfManagedKafkaEvent } from 'aws-lambda';
import { Envelopes } from '../../../src/envelopes/Envelopes.js';

describe('Kafka', () => {
  const envelope = Envelopes.KAFKA_ENVELOPE;

  it('should parse MSK kafka envelope', () => {
    const mock = generateMock(TestSchema);

    const kafkaEvent = TestEvents.kafkaEventMsk as MSKEvent;
    kafkaEvent.records['mytopic-0'][0].value = Buffer.from(
      JSON.stringify(mock)
    ).toString('base64');

    const result = envelope.parse(kafkaEvent, TestSchema);

    expect(result).toEqual([[mock]]);
  });

  it('should parse Self Managed kafka envelope', () => {
    const mock = generateMock(TestSchema);

    const kafkaEvent =
      TestEvents.kafkaEventSelfManaged as SelfManagedKafkaEvent;
    kafkaEvent.records['mytopic-0'][0].value = Buffer.from(
      JSON.stringify(mock)
    ).toString('base64');

    const result = envelope.parse(kafkaEvent, TestSchema);

    expect(result).toEqual([[mock]]);
  });
});
