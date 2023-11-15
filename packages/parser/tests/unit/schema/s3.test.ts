/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import {
  S3Schema,
  S3EventNotificationEventBridgeSchema,
  S3SqsEventNotificationSchema,
} from '../../../src/schemas/s3';
import s3Event from '../../events/s3Event.json';
import s3EventBridgeNotificationObjectCreatedEvent from '../../events/s3EventBridgeNotificationObjectCreatedEvent.json';
import s3EventBridgeNotificationObjectDeletedEvent from '../../events/s3EventBridgeNotificationObjectDeletedEvent.json';
import s3EventBridgeNotificationObjectExpiredEvent from '../../events/s3EventBridgeNotificationObjectExpiredEvent.json';
import s3SqsEvent from '../../events/s3SqsEvent.json';

describe('S3 ', () => {
  it('should parse s3 event', () => {
    expect(S3Schema.parse(s3Event)).toEqual(s3Event);
  });

  it('should parse s3 event bridge notification event created', () => {
    expect(
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectCreatedEvent
      )
    ).toEqual(s3EventBridgeNotificationObjectCreatedEvent);
  });

  it('should parse s3 event bridge notification event detelted', () => {
    expect(
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectDeletedEvent
      )
    ).toEqual(s3EventBridgeNotificationObjectDeletedEvent);
  });
  it('should parse s3 event bridge notification event expired', () => {
    expect(
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectExpiredEvent
      )
    ).toEqual(s3EventBridgeNotificationObjectExpiredEvent);
  });

  it('should parse s3 sqs notification event', () => {
    expect(S3SqsEventNotificationSchema.parse(s3SqsEvent)).toEqual(s3SqsEvent);
  });
});
