/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { APIGatewayProxyEventV2Schema } from '../../../src/schemas/apigwv2';
import apiGatewayProxyV2Event from '../../events/apiGatewayProxyV2Event.json';

describe('API GW v2 ', () => {
  it('APIGatewayV2 should parse api gateway v2 event', () => {
    APIGatewayProxyEventV2Schema.parse(apiGatewayProxyV2Event);
  });
});
