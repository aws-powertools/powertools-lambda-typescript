/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { LambdaFunctionUrlSchema } from '../../../src/schemas/';
import { TestEvents } from './utils.js';

describe('Lambda ', () => {
  it('should parse lambda event', () => {
    const lambdaFunctionUrlEvent = TestEvents.apiGatewayProxyV2Event;

    expect(LambdaFunctionUrlSchema.parse(lambdaFunctionUrlEvent)).toEqual(
      lambdaFunctionUrlEvent
    );
  });

  it('should parse url IAM event', () => {
    const urlIAMEvent = TestEvents.lambdaFunctionUrlIAMEvent;

    expect(LambdaFunctionUrlSchema.parse(urlIAMEvent)).toEqual(urlIAMEvent);
  });
});
