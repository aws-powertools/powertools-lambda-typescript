/**
 * Test decorator parser
 *
 * @group unit/parser
 */

import { LambdaInterface } from '@aws-lambda-powertools/commons/lib/esm/types';
import { Context, EventBridgeEvent } from 'aws-lambda';
import { parser } from '../../src/parser';
import { TestSchema, TestEvents } from './schema/utils';
import { generateMock } from '@anatine/zod-mock';
import { eventBridgeEnvelope } from '../../src/envelopes/event-bridge';
import { EventBridgeSchema } from '../../src/schemas/eventbridge';
import { z } from 'zod';

describe('Parser Decorator', () => {
  const customEventBridgeSchema = EventBridgeSchema.extend({
    detail: TestSchema,
  });

  type TestSchema = z.infer<typeof TestSchema>;

  class TestClass implements LambdaInterface {
    @parser({ schema: TestSchema })
    public async handler(
      event: TestSchema,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({ schema: customEventBridgeSchema })
    public async handlerWithCustomSchema(
      event: unknown,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({ envelope: eventBridgeEnvelope, schema: TestSchema })
    public async handlerWithSchemaAndEnvelope(
      event: unknown,
      _context: Context
    ): Promise<unknown> {
      return event;
    }
  }

  const lambda = new TestClass();

  it('should parse custom schema event', async () => {
    const testEvent = generateMock(TestSchema);

    const resp = await lambda.handler(testEvent, {} as Context);

    expect(resp).toEqual(testEvent);
  });

  it('should parse custom schema with envelope event', async () => {
    const customPayload = generateMock(TestSchema);
    const testEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
      string,
      unknown
    >;
    testEvent.detail = customPayload;

    const resp = await lambda.handlerWithSchemaAndEnvelope(
      testEvent,
      {} as Context
    );

    expect(resp).toEqual(customPayload);
  });

  it('should parse extended envelope event', async () => {
    const customPayload = generateMock(TestSchema);

    const testEvent = generateMock(customEventBridgeSchema);
    testEvent.detail = customPayload;

    const resp: z.infer<typeof customEventBridgeSchema> =
      (await lambda.handlerWithCustomSchema(
        testEvent,
        {} as Context
      )) as z.infer<typeof customEventBridgeSchema>;

    expect(customEventBridgeSchema.parse(resp)).toEqual(testEvent);
    expect(resp.detail).toEqual(customPayload);
  });

  it('should return original event if no schema is provided', async () => {});
});
