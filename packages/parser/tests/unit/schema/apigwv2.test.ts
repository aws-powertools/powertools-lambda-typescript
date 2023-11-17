/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { APIGatewayProxyEventV2Schema } from '../../../src/schemas/apigwv2';
import { loadExampleEvent } from './utils';

describe('API GW v2 ', () => {
  it('should parse api gateway v2 event', () => {
    const apiGatewayProxyV2Event = loadExampleEvent(
      'apiGatewayProxyV2Event.json'
    );
    expect(APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event)).toEqual(
      apiGatewayProxyV2Event
    );
  });
  it('should parse api gateway v2 event with GET method', () => {
    const apiGatewayProxyV2Event_GET = loadExampleEvent(
      'apiGatewayProxyV2Event_GET.json'
    );
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event_GET)
    ).toEqual(apiGatewayProxyV2Event_GET);
  });
  it('should parse api gateway v2 event with path trailing slash', () => {
    const apiGatewayProxyV2EventPathTrailingSlash = loadExampleEvent(
      'apiGatewayProxyV2EventPathTrailingSlash.json'
    );
    expect(
      APIGatewayProxyEventV2Schema.parse(
        apiGatewayProxyV2EventPathTrailingSlash
      )
    ).toEqual(apiGatewayProxyV2EventPathTrailingSlash);
  });
  it('should parse api gateway v2 event with iam', () => {
    const apiGatewayProxyV2IamEvent = loadExampleEvent(
      'apiGatewayProxyV2IamEvent.json'
    );
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2IamEvent)
    ).toEqual(apiGatewayProxyV2IamEvent);
  });
  it('should parse api gateway v2 event with lambda authorizer', () => {
    const apiGatewayProxyV2LambdaAuthorizerEvent = loadExampleEvent(
      'apiGatewayProxyV2LambdaAuthorizerEvent.json'
    );
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2LambdaAuthorizerEvent)
    ).toEqual(apiGatewayProxyV2LambdaAuthorizerEvent);
  });
  it('should parse api gateway v2 event with other get event', () => {
    const apiGatewayProxyV2OtherGetEvent = loadExampleEvent(
      'apiGatewayProxyV2OtherGetEvent.json'
    );
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2OtherGetEvent)
    ).toEqual(apiGatewayProxyV2OtherGetEvent);
  });
  it('should parse api gateway v2 event with schema middleware', () => {
    const apiGatewayProxyV2SchemaMiddlewareValidEvent = loadExampleEvent(
      'apiGatewayProxyV2SchemaMiddlewareValidEvent.json'
    );
    expect(
      APIGatewayProxyEventV2Schema.parse(
        apiGatewayProxyV2SchemaMiddlewareValidEvent
      )
    ).toEqual(apiGatewayProxyV2SchemaMiddlewareValidEvent);
  });
});
