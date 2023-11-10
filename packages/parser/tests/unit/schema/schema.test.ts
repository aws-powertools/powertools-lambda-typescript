/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import dynamodbStreamEvent from '../../events/dynamoStreamEvent.json';
import albEvent from '../../events/albEvent.json';
import apiGatewayProxyEvent from '../../events/apiGatewayProxyEvent.json';
import apiGatewayProxyV2Event from '../../events/apiGatewayProxyV2Event.json';
import cloudFormationCustomResourceCreateEvent from '../../events/cloudformationCustomResourceCreate.json';
import cloudFormationCustomResourceUpdateEvent from '../../events/cloudformationCustomResourceUpdate.json';
import cloudFormationCustomResourceDeleteEvent from '../../events/cloudformationCustomResourceDelete.json';
import eventBridgeEvent from '../../events/eventBridgeEvent.json';
import s3Event from '../../events/s3Event.json';
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
} from '../../../src';

/**
 * keep everything in one describe block for now.
 * once we have more examples, we can break them out into their own describe blocks
 */
describe('Schema:', () => {
  it('DynamoDB should parse a stream of records', () => {
    DynamoDBStreamSchema.parse(dynamodbStreamEvent);
  });
  it('ALB should parse alb event', () => {
    AlbSchema.parse(albEvent);
  });
  it('APIGateway should parse api gateway event', () => {
    APIGatewayProxyEventSchema.parse(apiGatewayProxyEvent);
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
  it('EventBridge should parse eventbridge event', () => {
    EventBridgeSchema.parse(eventBridgeEvent);
  });
  it('S3 should parse s3 event', () => {
    S3Schema.parse(s3Event);
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
