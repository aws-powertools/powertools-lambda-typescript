/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { loadExampleEvent } from './utils.js';
import { LambdaFunctionUrlSchema } from '../../../src/schemas/lambda.js';

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
