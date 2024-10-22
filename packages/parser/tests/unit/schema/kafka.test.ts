import type { MSKEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import {
  KafkaMskEventSchema,
  KafkaRecordSchema,
  KafkaSelfManagedEventSchema,
} from '../../../src/schemas/';
import type { KafkaMskEvent, KafkaSelfManagedEvent } from '../../../src/types';
import type { KafkaRecord } from '../../../src/types/schema';
import { getTestEvent } from '../helpers/utils.js';

describe('Kafka ', () => {
  it('parses a MSK event', () => {
    // Prepare
    const event = getTestEvent<MSKEvent & { [key: string]: unknown }>({
      eventsPath: 'kafka',
      filename: 'msk',
    });
    const expectedMSKParsedEvent: KafkaMskEvent = {
      ...event,
      bootstrapServers: event.bootstrapServers.split(','),
      records: {
        [Object.keys(event.records)[0]]: [
          {
            ...event.records[Object.keys(event.records)[0]][0],
            key: 'recordKey',
            value: JSON.stringify({ key: 'value' }),
            headers: [
              {
                headerKey: 'headerValue',
              },
            ],
          },
        ],
      },
    };

    // Act
    const parsedEvent = KafkaMskEventSchema.parse(event);

    // Assess
    expect(parsedEvent).toEqual(expectedMSKParsedEvent);
  });

  /* it('should parse kafka MSK event', () => {
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
  }); */
});
