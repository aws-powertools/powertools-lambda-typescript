/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import {
  KafkaMskEventSchema,
  KafkaRecordSchema,
  KafkaSelfManagedEventSchema,
} from '../../../src/schemas/';
import type { KafkaSelfManagedEvent } from '../../../src/types';
import type { KafkaRecord } from '../../../src/types/schema';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

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
    const kafkaEventMsk = TestEvents.kafkaEventMsk;

    expect(
      KafkaMskEventSchema.parse(kafkaEventMsk).records['mytopic-0'][0]
    ).toEqual(expectedTestEvent);
  });
  it('should parse kafka self managed event', () => {
    const kafkaEventSelfManaged = TestEvents.kafkaEventSelfManaged;

    expect(
      KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged).records[
        'mytopic-0'
      ][0]
    ).toEqual(expectedTestEvent);
  });
  it('should transform bootstrapServers to array', () => {
    const kafkaEventSelfManaged = TestEvents.kafkaEventSelfManaged;

    expect(
      KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged).bootstrapServers
    ).toEqual([
      'b-2.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092',
      'b-1.demo-cluster-1.a1bcde.c1.kafka.us-east-1.amazonaws.com:9092',
    ]);
  });
  it('should return undefined if bootstrapServers is not present', () => {
    const kafkaEventSelfManaged = TestEvents.kafkaEventSelfManaged as {
      bootstrapServers: string;
    };
    kafkaEventSelfManaged.bootstrapServers = '';
    const parsed = KafkaSelfManagedEventSchema.parse(kafkaEventSelfManaged);

    expect(parsed.bootstrapServers).toBeUndefined();
  });
  it('should parse kafka record from kafka event', () => {
    const kafkaEventMsk: KafkaSelfManagedEvent =
      TestEvents.kafkaEventSelfManaged as KafkaSelfManagedEvent;
    const parsedRecord: KafkaRecord = KafkaRecordSchema.parse(
      kafkaEventMsk.records['mytopic-0'][0]
    );
    expect(parsedRecord.topic).toEqual('mytopic');
  });

  describe('should detect missing properties in schema for', () => {
    it('KafkaMskEventSchema', () => {
      const kafkaEventMsk = TestEvents.kafkaEventMsk;

      const strictSchema = makeSchemaStrictForTesting(KafkaMskEventSchema);
      expect(() => strictSchema.parse(kafkaEventMsk)).not.toThrow();
    });

    it('KafkaSelfManagedEventSchema', () => {
      const kafkaEventSelfManaged = TestEvents.kafkaEventSelfManaged;

      const strictSchema = makeSchemaStrictForTesting(
        KafkaSelfManagedEventSchema
      );
      expect(() => strictSchema.parse(kafkaEventSelfManaged)).not.toThrow();
    });
  });
});
