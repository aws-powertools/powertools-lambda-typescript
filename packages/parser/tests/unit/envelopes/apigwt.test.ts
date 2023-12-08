/**
 * Test built in schema envelopes for api gateway
 *
 * @group unit/parser/envelopes
 */

import { generateMock } from '@anatine/zod-mock';
import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { ApiGatewayProxyEvent } from '../../../src/types/schema.js';

describe('ApigwEnvelope ', () => {
  const envelope = Envelopes.API_GW_ENVELOPE;
  it('should parse custom schema in envelope', () => {
    const testCustomSchemaObject = generateMock(TestSchema);
    const testEvent = TestEvents.apiGatewayProxyEvent as ApiGatewayProxyEvent;

    testEvent.body = JSON.stringify(testCustomSchemaObject);
    const resp = envelope.parse(testEvent, TestSchema);
    expect(resp).toEqual(testCustomSchemaObject);
  });

  it('should throw no body provided', () => {
    const testEvent = TestEvents.apiGatewayProxyEvent as ApiGatewayProxyEvent;
    testEvent.body = undefined;

    expect(() => envelope.parse(testEvent, TestSchema)).toThrow();
  });
});
