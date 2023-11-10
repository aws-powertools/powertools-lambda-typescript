/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import dynamodbStreamEvent from '../../events/dynamoStreamEvent.json';
import albEvent from '../../events/albEvent.json';
import albEventPathTrailingSlash from '../../events/albEventPathTrailingSlash.json';
import albMultiValueHeadersEvent from '../../events/albMultiValueHeadersEvent.json';
import apiGatewayProxyEvent from '../../events/apiGatewayProxyEvent.json';
import apiGatewayAuthorizerRequestEvent from '../../events/apiGatewayAuthorizerRequestEvent.json';
import apiGatewayProxyV2Event from '../../events/apiGatewayProxyV2Event.json';
import cloudFormationCustomResourceCreateEvent from '../../events/cloudformationCustomResourceCreate.json';
import cloudFormationCustomResourceUpdateEvent from '../../events/cloudformationCustomResourceUpdate.json';
import cloudFormationCustomResourceDeleteEvent from '../../events/cloudformationCustomResourceDelete.json';
import eventBridgeEvent from '../../events/eventBridgeEvent.json';
import s3Event from '../../events/s3Event.json';
import s3EventBridgeNotificationObjectCreatedEvent from '../../events/s3EventBridgeNotificationObjectCreatedEvent.json';
import s3EventBridgeNotificationObjectDeletedEvent from '../../events/s3EventBridgeNotificationObjectDeletedEvent.json';
import s3EventBridgeNotificationObjectExpiredEvent from '../../events/s3EventBridgeNotificationObjectExpiredEvent.json';
import s3SqsEvent from '../../events/s3SqsEvent.json';
import sesEvent from '../../events/sesEvent.json';
import snsEvent from '../../events/snsEvent.json';
import sqsEvent from '../../events/sqsEvent.json';
import {
  AlbSchema,
  APIGatewayProxyEventSchema,
  APIGatewayProxyEventV2Schema,
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceUpdateSchema,
  CloudFormationCustomResourceDeleteSchema,
  DynamoDBStreamSchema,
  EventBridgeSchema,
  S3Schema,
  SesSchema,
  SnsSchema,
  SqsSchema,
  S3EventNotificationEventBridgeSchema,
  S3SqsEventNotificationSchema,
  AlbMultiValueHeadersSchema,
} from '../../../src';

/**
 * keep everything in one describe block for now.
 * once we have more examples, we can break them out into their own describe blocks
 */
describe('Schema:', () => {
  describe('ALB ', () => {
    it('should parse alb event', () => {
      AlbSchema.parse(albEvent);
    });
    it('should parse alb event path trailing slash', () => {
      AlbSchema.parse(albEventPathTrailingSlash);
    });
    it('should parse alb event with multi value headers event', () => {
      AlbMultiValueHeadersSchema.parse(albMultiValueHeadersEvent);
    });
  });
  describe('APIGateway ', () => {
    it('should parse api gateway event', () => {
      APIGatewayProxyEventSchema.parse(apiGatewayProxyEvent);
    });
    it('should parse api gateway authorizer request event', () => {
      APIGatewayProxyEventSchema.parse(apiGatewayAuthorizerRequestEvent);
    });
  });
  it('APIGatewayV2 should parse api gateway v2 event', () => {
    APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event);
  });
  describe('CloudFormationCustomResource ', () => {
    it('should parse create event', () => {
      CloudFormationCustomResourceCreateSchema.parse(
        cloudFormationCustomResourceCreateEvent
      );
    });
    it('should parse update event', () => {
      CloudFormationCustomResourceUpdateSchema.parse(
        cloudFormationCustomResourceUpdateEvent
      );
    });
    it('should parse delete event', () => {
      CloudFormationCustomResourceDeleteSchema.parse(
        cloudFormationCustomResourceDeleteEvent
      );
    });
  });
  it('DynamoDB should parse a stream of records', () => {
    DynamoDBStreamSchema.parse(dynamodbStreamEvent);
  });
  it('EventBridge should parse eventbridge event', () => {
    EventBridgeSchema.parse(eventBridgeEvent);
  });
  describe('S3 ', () => {
    it('should parse s3 event', () => {
      S3Schema.parse(s3Event);
    });

    it('should parse s3 event bridge notification event created', () => {
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectCreatedEvent
      );
    });

    it('should parse s3 event bridge notification event detelted', () => {
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectDeletedEvent
      );
    });
    it('should parse s3 event bridge notification event expired', () => {
      S3EventNotificationEventBridgeSchema.parse(
        s3EventBridgeNotificationObjectExpiredEvent
      );
    });

    it('should parse s3 sqs notification event', () => {
      S3SqsEventNotificationSchema.parse(s3SqsEvent);
    });
  });
  it('SNS should parse sns event', () => {
    SnsSchema.parse(snsEvent);
  });
  it('SQS should parse sqs event', () => {
    SqsSchema.parse(sqsEvent);
  });
  it('SES should parse ses event', () => {
    SesSchema.parse(sesEvent);
  });
});
