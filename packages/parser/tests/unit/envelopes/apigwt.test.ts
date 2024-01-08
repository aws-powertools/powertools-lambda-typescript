/**
 * Test built in schema envelopes for api gateway
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { APIGatewayProxyEvent } from '../../../src/types/schema.js';
import { apiGatewayEnvelope } from '../../../src/envelopes/apigw';

describe('ApigwEnvelope ', () => {
  it('should parse custom schema in envelope', () => {
    const testCustomSchemaObject = generateMock(TestSchema);
    const testEvent = TestEvents.apiGatewayProxyEvent as APIGatewayProxyEvent;

    testEvent.body = JSON.stringify(testCustomSchemaObject);

    const resp = apiGatewayEnvelope(testEvent, TestSchema);
    expect(resp).toEqual(testCustomSchemaObject);
  });

  it('should throw no body provided', () => {
    const testEvent = TestEvents.apiGatewayProxyEvent as APIGatewayProxyEvent;
    testEvent.body = undefined;

    expect(() => apiGatewayEnvelope(testEvent, TestSchema)).toThrow();
  });
});
