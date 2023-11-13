/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { APIGatewayProxyEventSchema } from '../../../src/schemas/apigw';
import apiGatewayProxyEvent from '../../events/apiGatewayProxyEvent.json';
import apiGatewayAuthorizerRequestEvent from '../../events/apiGatewayAuthorizerRequestEvent.json';

describe('APIGateway ', () => {
  it('should parse api gateway event', () => {
    APIGatewayProxyEventSchema.parse(apiGatewayProxyEvent);
  });
  it('should parse api gateway authorizer request event', () => {
    APIGatewayProxyEventSchema.parse(apiGatewayAuthorizerRequestEvent);
  });
});
