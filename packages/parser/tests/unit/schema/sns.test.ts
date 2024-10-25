/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import {
  SnsNotificationSchema,
  SnsRecordSchema,
  SnsSchema,
  SnsSqsNotificationSchema,
} from '../../../src/schemas/';
import type { SnsEvent, SqsEvent } from '../../../src/types';
import type {
  SnsNotification,
  SnsRecord,
  SnsSqsNotification,
} from '../../../src/types/schema';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

describe('SNS', () => {
  it('should parse sns event', () => {
    const snsEvent = TestEvents.snsEvent;
    expect(SnsSchema.parse(snsEvent)).toEqual(snsEvent);
  });
  it('should parse record from sns event', () => {
    const snsEvent: SnsEvent = TestEvents.snsEvent as SnsEvent;
    const parsed: SnsRecord = SnsRecordSchema.parse(snsEvent.Records[0]);
    expect(parsed.Sns.Message).toEqual('Hello from SNS!');
  });
  it('should parse sns notification from sns event', () => {
    const snsEvent: SnsEvent = TestEvents.snsEvent as SnsEvent;
    const parsed: SnsNotification = SnsNotificationSchema.parse(
      snsEvent.Records[0].Sns
    );
    expect(parsed.Message).toEqual('Hello from SNS!');
  });
  it('should parse sns notification from sqs -> sns event', () => {
    const sqsEvent: SqsEvent = TestEvents.snsSqsEvent as SqsEvent;
    console.log(sqsEvent.Records[0].body);
    const parsed: SnsSqsNotification = SnsSqsNotificationSchema.parse(
      JSON.parse(sqsEvent.Records[0].body)
    );
    expect(parsed.TopicArn).toEqual(
      'arn:aws:sns:eu-west-1:231436140809:powertools265'
    );
  });

  describe('should detect missing properties in schema for ', () => {
    it('sns event', () => {
      const snsEvent = TestEvents.snsEvent;
      const strictSchema = makeSchemaStrictForTesting(SnsSchema);
      expect(() => strictSchema.parse(snsEvent)).not.toThrow();
    });

    it('sns record', () => {
      const snsEvent: SnsEvent = TestEvents.snsEvent as SnsEvent;
      const strictSchema = makeSchemaStrictForTesting(SnsRecordSchema);
      expect(() => strictSchema.parse(snsEvent.Records[0])).not.toThrow();
    });
  });
});
