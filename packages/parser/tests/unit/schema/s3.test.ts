/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import {
  S3EventNotificationEventBridgeSchema,
  S3ObjectLambdaEventSchema,
  S3Schema,
  S3SqsEventNotificationSchema,
} from '../../../src/schemas/';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

describe('S3 ', () => {
  it('should parse s3 event', () => {
    const s3Event = TestEvents.s3Event;

    expect(S3Schema.parse(s3Event)).toEqual(s3Event);
  });

  it('should parse s3 event bridge notification event created', () => {
    const s3EventBridgeNotificationObjectCreatedEvent =
      TestEvents.s3EventBridgeNotificationObjectCreatedEvent;

    expect(
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectCreatedEvent
      )
    ).toEqual(s3EventBridgeNotificationObjectCreatedEvent);
  });

  it('should parse s3 event bridge notification event detelted', () => {
    const s3EventBridgeNotificationObjectDeletedEvent =
      TestEvents.s3EventBridgeNotificationObjectDeletedEvent;

    expect(
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectDeletedEvent
      )
    ).toEqual(s3EventBridgeNotificationObjectDeletedEvent);
  });
  it('should parse s3 event bridge notification event expired', () => {
    const s3EventBridgeNotificationObjectExpiredEvent =
      TestEvents.s3EventBridgeNotificationObjectExpiredEvent;

    expect(
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectExpiredEvent
      )
    ).toEqual(s3EventBridgeNotificationObjectExpiredEvent);
  });

  it('should parse s3 sqs notification event', () => {
    const s3SqsEvent = TestEvents.s3SqsEvent;
    expect(S3SqsEventNotificationSchema.parse(s3SqsEvent)).toEqual(s3SqsEvent);
  });

  it('should parse s3 event with decoded key', () => {
    const s3EventDecodedKey = TestEvents.s3EventDecodedKey;
    expect(S3Schema.parse(s3EventDecodedKey)).toEqual(s3EventDecodedKey);
  });

  it('should parse s3 event delete object', () => {
    const s3EventDeleteObject = TestEvents.s3EventDeleteObject;
    expect(S3Schema.parse(s3EventDeleteObject)).toEqual(s3EventDeleteObject);
  });

  it('should parse s3 event glacier', () => {
    const s3EventGlacier = TestEvents.s3EventGlacier;
    expect(S3Schema.parse(s3EventGlacier)).toEqual(s3EventGlacier);
  });

  it('should parse s3 object event iam user', () => {
    const s3ObjectEventIAMUser = TestEvents.s3ObjectEventIAMUser;
    expect(S3ObjectLambdaEventSchema.parse(s3ObjectEventIAMUser)).toEqual(
      s3ObjectEventIAMUser
    );
  });

  it('should parse s3 object event temp credentials', () => {
    // ignore any because we don't want typed json
    const s3ObjectEventTempCredentials =
      // biome-ignore lint/suspicious/noExplicitAny: no specific typing needed
      TestEvents.s3ObjectEventTempCredentials as any;
    const parsed = S3ObjectLambdaEventSchema.parse(
      s3ObjectEventTempCredentials
    );

    expect(parsed.userRequest).toEqual(
      s3ObjectEventTempCredentials.userRequest
    );
    expect(parsed.getObjectContext).toEqual(
      s3ObjectEventTempCredentials.getObjectContext
    );
    expect(parsed.configuration).toEqual(
      s3ObjectEventTempCredentials.configuration
    );
    expect(parsed.userRequest).toEqual(
      s3ObjectEventTempCredentials.userRequest
    );
    expect(
      parsed.userIdentity?.sessionContext?.attributes.mfaAuthenticated
    ).toEqual(false);
  });

  describe('should detect missing properties in schema for ', () => {
    it('s3 event', () => {
      const s3Event = TestEvents.s3Event;
      const strictSchema = makeSchemaStrictForTesting(S3Schema);
      expect(strictSchema.parse(s3Event)).toEqual(s3Event);
    });

    it('s3 event bridge notification event created', () => {
      const s3EventBridgeNotificationObjectCreatedEvent =
        TestEvents.s3EventBridgeNotificationObjectCreatedEvent;
      const strictSchema = makeSchemaStrictForTesting(
        S3EventNotificationEventBridgeSchema
      );
      expect(() =>
        strictSchema.parse(s3EventBridgeNotificationObjectCreatedEvent)
      ).not.toThrow();
    });

    it('s3 event bridge notification event detelted', () => {
      const s3EventBridgeNotificationObjectDeletedEvent =
        TestEvents.s3EventBridgeNotificationObjectDeletedEvent;
      const strictSchema = makeSchemaStrictForTesting(
        S3EventNotificationEventBridgeSchema
      );
      expect(() =>
        strictSchema.parse(s3EventBridgeNotificationObjectDeletedEvent)
      ).not.toThrow();
    });

    it('s3 sqs notification event', () => {
      const s3SqsEvent = TestEvents.s3SqsEvent;
      const strictSchema = makeSchemaStrictForTesting(
        S3SqsEventNotificationSchema
      );
      expect(() => strictSchema.parse(s3SqsEvent)).not.toThrow();
    });
  });
});
