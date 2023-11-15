/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { APIGatewayProxyEventSchema } from '../../../src/schemas/apigw';
import apiGatewayProxyEvent from '../../events/apiGatewayProxyEvent.json';
import apiGatewayAuthorizerRequestEvent from '../../events/apiGatewayAuthorizerRequestEvent.json';
import apiGatewaySchemaMiddlewareInvalidEvent from '../../events/apiGatewaySchemaMiddlewareInvalidEvent.json';
import apiGatewaySchemaMiddlewareValidEvent from '../../events/apiGatewaySchemaMiddlewareValidEvent.json';
import apiGatewayProxyEvent_noVersionAuth from '../../events/apiGatewayProxyEvent_noVersionAuth.json';
import apiGatewayProxyEventAnotherPath from '../../events/apiGatewayProxyEventAnotherPath.json';
import apiGatewayProxyEventPathTrailingSlash from '../../events/apiGatewayProxyEventPathTrailingSlash.json';
import apiGatewayProxyOtherEvent from '../../events/apiGatewayProxyOtherEvent.json';

describe('APIGateway ', () => {
  it('should parse api gateway event', () => {
    expect(APIGatewayProxyEventSchema.parse(apiGatewayProxyEvent)).toEqual(
      apiGatewayProxyEvent
    );
  });
  it('should parse api gateway authorizer request event', () => {
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewayAuthorizerRequestEvent)
    ).toEqual(apiGatewayAuthorizerRequestEvent);
  });
  it('should parse schema middleware invalid event', () => {
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewaySchemaMiddlewareInvalidEvent)
    ).toEqual(apiGatewaySchemaMiddlewareInvalidEvent);
  });
  it('should parse schema middleware valid event', () => {
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewaySchemaMiddlewareValidEvent)
    ).toEqual(apiGatewaySchemaMiddlewareValidEvent);
  });
  it('should parse proxy event with no version auth', () => {
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewayProxyEvent_noVersionAuth)
    ).toEqual(apiGatewayProxyEvent_noVersionAuth);
  });
  it('should parse proxy event with another path', () => {
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewayProxyEventAnotherPath)
    ).toEqual(apiGatewayProxyEventAnotherPath);
  });
  it('should parse proxy event with path trailing slash', () => {
    expect(
      APIGatewayProxyEventSchema.parse(apiGatewayProxyEventPathTrailingSlash)
    ).toEqual(apiGatewayProxyEventPathTrailingSlash);
  });
  it('should parse other proxy event', () => {
    expect(APIGatewayProxyEventSchema.parse(apiGatewayProxyOtherEvent)).toEqual(
      apiGatewayProxyOtherEvent
    );
  });
  it('should throw error when event is not a valid proxy event', () => {
    const event = {
      resource: '/',
      path: '/',
      httpMethod: 'GET',
      headers: {},
      multiValueHeaders: {},
      isBase64Encoded: false,
      body: 'Foo!',
      requestContext: {
        accountId: '1234',
        apiId: 'myApi',
        httpMethod: 'GET',
        identity: {
          sourceIp: '127.0.0.1',
        },
        path: '/',
        protocol: 'Https',
        requestId: '1234',
        requestTime: '2018-09-07T16:20:46Z',
        requestTimeEpoch: 1536992496000,
        resourcePath: '/',
        stage: 'test',
        eventType: 'DISCONNECT',
        messageId: 'messageId',
      },
    };
    expect(() => APIGatewayProxyEventSchema.parse(event)).toThrow();
  });
});
