/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { APIGatewayProxyEventV2Schema } from '../../../src/schemas/apigwv2';
import apiGatewayProxyV2Event from '../../events/apiGatewayProxyV2Event.json';
import apiGatewayProxyV2Event_GET from '../../events/apiGatewayProxyV2Event_GET.json';
import apiGatewayProxyV2EventPathTrailingSlash from '../../events/apiGatewayProxyV2EventPathTrailingSlash.json';
import apiGatewayProxyV2IamEvent from '../../events/apiGatewayProxyV2IamEvent.json';
import apiGatewayProxyV2LambdaAuthorizerEvent from '../../events/apiGatewayProxyV2LambdaAuthorizerEvent.json';
import apiGatewayProxyV2OtherGetEvent from '../../events/apiGatewayProxyV2OtherGetEvent.json';
import apiGatewayProxyV2SchemaMiddlewareValidEvent from '../../events/apiGatewayProxyV2SchemaMiddlewareValidEvent.json';

describe('API GW v2 ', () => {
  it('should parse api gateway v2 event', () => {
    expect(APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event)).toEqual(
      apiGatewayProxyV2Event
    );
  });
  it('should parse api gateway v2 event with GET method', () => {
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event_GET)
    ).toEqual(apiGatewayProxyV2Event_GET);
  });
  it('should parse api gateway v2 event with path trailing slash', () => {
    expect(
      APIGatewayProxyEventV2Schema.parse(
        apiGatewayProxyV2EventPathTrailingSlash
      )
    ).toEqual(apiGatewayProxyV2EventPathTrailingSlash);
  });
  it('should parse api gateway v2 event with iam', () => {
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2IamEvent)
    ).toEqual(apiGatewayProxyV2IamEvent);
  });
  it('should parse api gateway v2 event with lambda authorizer', () => {
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2LambdaAuthorizerEvent)
    ).toEqual(apiGatewayProxyV2LambdaAuthorizerEvent);
  });
  it('should parse api gateway v2 event with other get event', () => {
    expect(
      APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2OtherGetEvent)
    ).toEqual(apiGatewayProxyV2OtherGetEvent);
  });
  it('should parse api gateway v2 event with schema middleware', () => {
    expect(
      APIGatewayProxyEventV2Schema.parse(
        apiGatewayProxyV2SchemaMiddlewareValidEvent
      )
    ).toEqual(apiGatewayProxyV2SchemaMiddlewareValidEvent);
  });
});
