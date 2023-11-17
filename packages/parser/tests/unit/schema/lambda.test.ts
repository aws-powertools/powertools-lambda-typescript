/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { loadExampleEvent } from './utils';
import { LambdaFunctionUrlSchema } from '../../../src/schemas/lambda';

describe('Lambda ', () => {
  it('should parse lambda event', () => {
    const lambdaFunctionUrlEvent = loadExampleEvent(
      'apiGatewayProxyV2Event.json'
    );
    expect(LambdaFunctionUrlSchema.parse(lambdaFunctionUrlEvent)).toEqual(
      lambdaFunctionUrlEvent
    );
  });
});
