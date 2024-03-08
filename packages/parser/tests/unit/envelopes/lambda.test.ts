/**
 * Test built in schema envelopes for Lambda Functions URL
 *
 * @group unit/parser/envelopes
 */

import { TestEvents, TestSchema } from '../schema/utils.js';
import { generateMock } from '@anatine/zod-mock';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { lambdaFunctionUrlEnvelope } from '../../../src/envelopes/';

describe('Lambda Functions Url ', () => {
  it('should parse custom schema in envelope', () => {
    const testEvent =
      TestEvents.lambdaFunctionUrlEvent as APIGatewayProxyEventV2;
    const data = generateMock(TestSchema);

    testEvent.body = JSON.stringify(data);

    expect(lambdaFunctionUrlEnvelope(testEvent, TestSchema)).toEqual(data);
  });

  it('should throw when no body provided', () => {
    const testEvent =
      TestEvents.apiGatewayProxyV2Event as APIGatewayProxyEventV2;
    testEvent.body = undefined;

    expect(() => lambdaFunctionUrlEnvelope(testEvent, TestSchema)).toThrow();
  });
});
