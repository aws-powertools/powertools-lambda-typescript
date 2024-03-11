/**
 * Test built in schema envelopes for api gateway v2
 *
 * @group unit/parser/envelopes
 */

import { TestEvents, TestSchema } from '../schema/utils.js';
import { generateMock } from '@anatine/zod-mock';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { apiGatewayV2Envelope } from '../../../src/envelopes/';

describe('ApiGwV2Envelope ', () => {
  it('should parse custom schema in envelope', () => {
    const testEvent =
      TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
    const data = generateMock(TestSchema);

    testEvent.body = JSON.stringify(data);

    expect(apiGatewayV2Envelope(testEvent, TestSchema)).toEqual(data);
  });

  it('should throw when no body provided', () => {
    const testEvent =
      TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
    testEvent.body = undefined;

    expect(() => apiGatewayV2Envelope(testEvent, TestSchema)).toThrow();
  });
});
