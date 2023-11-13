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
import cloudWatchLogEvent from '../../events/cloudWatchLogEvent.json';
import eventBridgeEvent from '../../events/eventBridgeEvent.json';
import kafkaEventMsk from '../../events/kafkaEventMsk.json';
import kafkaEventSelfManaged from '../../events/kafkaEventSelfManaged.json';
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
  AlbMultiValueHeadersSchema,
} from '../../../src/schemas/alb';
import { APIGatewayProxyEventSchema } from '../../../src/schemas/apigw';
import { APIGatewayProxyEventV2Schema } from '../../../src/schemas/apigwv2';
import {
  CloudFormationCustomResourceCreateSchema,
  CloudFormationCustomResourceUpdateSchema,
  CloudFormationCustomResourceDeleteSchema,
} from '../../../src/schemas/cloudformation-custom-resource';
import { DynamoDBStreamSchema } from '../../../src/schemas/dynamodb';
import { EventBridgeSchema } from '../../../src/schemas/eventbridge';
import {
  S3Schema,
  S3EventNotificationEventBridgeSchema,
  S3SqsEventNotificationSchema,
} from '../../../src/schemas/s3';
import { SnsSchema } from '../../../src/schemas/sns';
import { SqsSchema } from '../../../src/schemas/sqs';
import { SesSchema } from '../../../src/schemas/ses';
import { CloudWatchLogsSchema } from '../../../src/schemas/cloudwatch';
import {
  KafkaMskEventSchema,
  KafkaSelfManagedEventSchema,
} from '../../../src/schemas/kafka';

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
  describe('CloudWatchLogs ', () => {
    it('should parse cloudwatch logs event', () => {
      const parsed = CloudWatchLogsSchema.parse(cloudWatchLogEvent);
      expect(parsed.awslogs.data).toBeDefined();
      expect(parsed.awslogs.data?.logEvents[0]).toEqual({
        id: 'eventId1',
        timestamp: 1440442987000,
        message: '[ERROR] First test message',
      });
    });
    it('should throw error if cloudwatch logs event is invalid', () => {
      expect(() =>
        CloudWatchLogsSchema.parse({
          awslogs: {
            data: 'invalid',
          },
        })
      ).toThrowError();
    });
  });
  it('DynamoDB should parse a stream of records', () => {
    DynamoDBStreamSchema.parse(dynamodbStreamEvent);
  });
  it('EventBridge should parse eventbridge event', () => {
    EventBridgeSchema.parse(eventBridgeEvent);
  });
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
