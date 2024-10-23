import { describe, expect, it } from 'vitest';
import {
  S3EventNotificationEventBridgeSchema,
  S3ObjectLambdaEventSchema,
  S3Schema,
  S3SqsEventNotificationSchema,
} from '../../../src/schemas/';
import { getTestEvent } from '../helpers/utils.js';

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
});
