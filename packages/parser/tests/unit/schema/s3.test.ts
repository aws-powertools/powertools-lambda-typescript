import { describe, expect, it } from 'vitest';
import {
  S3EventNotificationEventBridgeSchema,
  S3ObjectLambdaEventSchema,
  S3Schema,
  S3SqsEventNotificationSchema,
} from '../../../src/schemas/s3.js';
import type {
  S3Event,
  S3EventNotificationEventBridge,
  S3ObjectLambdaEvent,
  S3SqsEventNotification,
} from '../../../src/types/schema.js';
import { getTestEvent, omit } from './utils.js';

describe('Schema: S3', () => {
  const eventsPath = 's3';
  const baseEvent = getTestEvent<S3Event>({
    eventsPath,
    filename: 'base',
  });
  const baseLambdaEvent = getTestEvent<S3ObjectLambdaEvent>({
    eventsPath,
    filename: 'object-iam-user',
  });

  it('parses an S3 event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = S3Schema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not an S3 event', () => {
    // Prepare
    const event = {
      Records: [],
    };

    // Act & Assess
    expect(() => S3Schema.parse(event)).toThrow();
  });

  it('throws if the event is missing required fields', () => {
    // Prepare
    const event = structuredClone(baseEvent);
    // @ts-expect-error - Intentionally remove required field
    event.Records[0].s3.bucket.name = undefined;

    // Act & Assess
    expect(() => S3Schema.parse(event)).toThrow();
  });

  it('parses an S3 Glacier event', () => {
    // Prepare
    const event = getTestEvent<S3Event>({
      eventsPath,
      filename: 'glacier',
    });

    // Act
    const result = S3Schema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an S3 event with a decoded key', () => {
    // Prepare
    const event = getTestEvent<S3Event>({
      eventsPath,
      filename: 'decoded-key',
    });

    // Act
    const result = S3Schema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an S3 event with a deleted object', () => {
    // Prepare
    const event = getTestEvent<S3Event>({
      eventsPath,
      filename: 'delete-object',
    });

    // Act
    const result = S3Schema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an S3 Object Lambda with an IAM user', () => {
    // Prepare
    const event = structuredClone(baseLambdaEvent);

    // Act
    const result = S3ObjectLambdaEventSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the S3 Object Lambda event is missing required fields', () => {
    // Prepare
    const event = omit(['getObjectContext'], structuredClone(baseLambdaEvent));

    // Act & Assess
    expect(() => S3ObjectLambdaEventSchema.parse(event)).toThrow();
  });

  it('parses an S3 Object Lambda with temporary credentials', () => {
    // Prepare
    const event = getTestEvent<S3ObjectLambdaEvent>({
      eventsPath,
      filename: 'object-temp-credentials',
    });
    const expected = structuredClone(event);
    // @ts-expect-error - Modifying the expected result to account for type coercion
    expected.userIdentity.sessionContext.attributes.mfaAuthenticated = false;

    // Act
    const result = S3ObjectLambdaEventSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it('parses an S3 Object Notification EventBridge event', () => {
    // Prepare
    const event = getTestEvent<S3EventNotificationEventBridge>({
      eventsPath,
      filename: 'eventbridge-object-created',
    });

    // Act
    const result = S3EventNotificationEventBridgeSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an S3 Object Notification EventBridge event for an object deleted', () => {
    // Prepare
    const event = getTestEvent<S3EventNotificationEventBridge>({
      eventsPath,
      filename: 'eventbridge-object-deleted',
    });

    // Act
    const result = S3EventNotificationEventBridgeSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an S3 Object Notification EventBridge event for an object expired', () => {
    // Prepare
    const event = getTestEvent<S3EventNotificationEventBridge>({
      eventsPath,
      filename: 'eventbridge-object-expired',
    });

    // Act
    const result = S3EventNotificationEventBridgeSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an S3 Object Notification EventBridge event for an object restored', () => {
    // Prepare
    const event = getTestEvent<S3EventNotificationEventBridge>({
      eventsPath,
      filename: 'eventbridge-object-restored',
    });

    // Act
    const result = S3EventNotificationEventBridgeSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses an S3 event notification SQS event', () => {
    // Prepare
    const event = getTestEvent<S3SqsEventNotification>({
      eventsPath,
      filename: 'sqs-event',
    });

    const expected = structuredClone(event);
    // @ts-expect-error - Modifying the expected result to account for transform
    expected.Records[0].body = JSON.parse(expected.Records[0].body);

    // Prepare
    const result = S3SqsEventNotificationSchema.parse(event);

    // Assess
    expect(result).toStrictEqual(expected);
  });

  it('throws if the S3 event notification SQS event is not valid', () => {
    // Prepare
    const event = {
      Records: [],
    };

    // Act & Assess
    expect(() => S3SqsEventNotificationSchema.parse(event)).toThrow();
  });
});
