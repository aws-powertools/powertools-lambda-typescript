/**
 * Test built in schema envelopes for api gateway v2
 *
 * @group unit/parser/envelopes
 */

import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { generateMock } from '@anatine/zod-mock';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

describe('ApiGwV2Envelope ', () => {
  const envelope = Envelopes.API_GW_V2_ENVELOPE;

  it('should parse custom schema in envelope', () => {
    const testEvent =
      TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
    const data = generateMock(TestSchema);

    testEvent.body = JSON.stringify(data);

    expect(envelope.parse(testEvent, TestSchema)).toEqual(data);
  });

  it('should throw when no body provided', () => {
    const testEvent =
      TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
    testEvent.body = undefined;

    expect(() => envelope.parse(testEvent, TestSchema)).toThrow();
  });
});
