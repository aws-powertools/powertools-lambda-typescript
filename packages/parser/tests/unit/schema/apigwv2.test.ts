/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { APIGatewayProxyEventV2Schema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('API GW v2 ', () => {
  it('should parse api gateway v2 event', () => {
    const apiGatewayProxyV2Event = TestEvents.apiGatewayProxyV2Event;

    expect(APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event)).toEqual(
      apiGatewayProxyV2Event
    );
  });
  it('should parse api gateway v2 event with GET method', () => {
    const apiGatewayProxyV2Event_GET = TestEvents.apiGatewayProxyV2Event_GET;
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event_GET)
    ).toEqual(apiGatewayProxyV2Event_GET);
  });
  it('should parse api gateway v2 event with path trailing slash', () => {
    const apiGatewayProxyV2EventPathTrailingSlash =
      TestEvents.apiGatewayProxyV2EventPathTrailingSlash;

    expect(
      APIGatewayProxyEventV2Schema.parse(
        apiGatewayProxyV2EventPathTrailingSlash
      )
    ).toEqual(apiGatewayProxyV2EventPathTrailingSlash);
  });
  it('should parse api gateway v2 event with iam', () => {
    const apiGatewayProxyV2IamEvent = TestEvents.apiGatewayProxyV2IamEvent;

    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2IamEvent)
    ).toEqual(apiGatewayProxyV2IamEvent);
  });
  it('should parse api gateway v2 event with lambda authorizer', () => {
    const apiGatewayProxyV2LambdaAuthorizerEvent =
      TestEvents.apiGatewayProxyV2LambdaAuthorizerEvent;

    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2LambdaAuthorizerEvent)
    ).toEqual(apiGatewayProxyV2LambdaAuthorizerEvent);
  });
  it('should parse api gateway v2 event with other get event', () => {
    const apiGatewayProxyV2OtherGetEvent =
      TestEvents.apiGatewayProxyV2OtherGetEvent;

    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2OtherGetEvent)
    ).toEqual(apiGatewayProxyV2OtherGetEvent);
  });
  it('should parse api gateway v2 event with schema middleware', () => {
    const apiGatewayProxyV2SchemaMiddlewareValidEvent =
      TestEvents.apiGatewayProxyV2SchemaMiddlewareValidEvent;

    expect(
      APIGatewayProxyEventV2Schema.parse(
        apiGatewayProxyV2SchemaMiddlewareValidEvent
      )
    ).toEqual(apiGatewayProxyV2SchemaMiddlewareValidEvent);
  });
});
