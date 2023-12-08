/**
 * Test built in schema envelopes for Lambda Functions URL
 *
 * @group unit/parser/envelopes
 */

import { Envelopes } from '../../../src/envelopes/Envelopes.js';
import { TestEvents, TestSchema } from '../schema/utils.js';
import { generateMock } from '@anatine/zod-mock';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

describe('Lambda Functions Url ', () => {
  const envelope = Envelopes.LAMBDA_FUCTION_URL_ENVELOPE;

  it('should parse custom schema in envelope', () => {
    const testEvent =
      TestEvents.lambdaFunctionUrlEvent as APIGatewayProxyEventV2;
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
