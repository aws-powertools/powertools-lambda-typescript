/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */

import { LambdaFunctionUrlSchema } from '../../../src/schemas/';
import { TestEvents, makeSchemaStrictForTesting } from './utils.js';

describe('Lambda ', () => {
  it('should parse lambda event', () => {
    const lambdaFunctionUrlEvent = TestEvents.lambdaFunctionUrlEvent;

    expect(LambdaFunctionUrlSchema.parse(lambdaFunctionUrlEvent)).toEqual(
      lambdaFunctionUrlEvent
    );
  });

  it('should parse url IAM event', () => {
    const urlIAMEvent = TestEvents.lambdaFunctionUrlIAMEvent;

    expect(LambdaFunctionUrlSchema.parse(urlIAMEvent)).toEqual(urlIAMEvent);
  });

  it('should detect missing properties in schema for lambda event', () => {
    const lambdaFunctionUrlEvent = TestEvents.lambdaFunctionUrlEvent;

    const strictSchema = makeSchemaStrictForTesting(LambdaFunctionUrlSchema);

    expect(() => strictSchema.parse(lambdaFunctionUrlEvent)).not.toThrow();
  });
});
