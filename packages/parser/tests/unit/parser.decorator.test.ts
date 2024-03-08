/**
 * Test decorator parser
 *
 * @group unit/parser
 */

import { LambdaInterface } from '@aws-lambda-powertools/commons/lib/esm/types';
import { Context, EventBridgeEvent } from 'aws-lambda';
import { parser } from '../../src/index.js';
import { TestSchema, TestEvents } from './schema/utils';
import { generateMock } from '@anatine/zod-mock';
import { eventBridgeEnvelope } from '../../src/envelopes/index.js';
import { EventBridgeSchema } from '../../src/schemas/index.js';
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

    @parser({ schema: TestSchema, envelope: eventBridgeEnvelope })
    public async handlerWithParserCallsAnotherMethod(
      event: unknown,
      _context: Context
    ): Promise<unknown> {
      return this.anotherMethod(event as TestSchema);
    }

    @parser({ envelope: eventBridgeEnvelope, schema: TestSchema })
    public async handlerWithSchemaAndEnvelope(
      event: unknown,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    private async anotherMethod(event: TestSchema): Promise<TestSchema> {
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

  it('should parse and call private async method', async () => {
    const customPayload = generateMock(TestSchema);
    const testEvent = TestEvents.eventBridgeEvent as EventBridgeEvent<
      string,
      unknown
    >;
    testEvent.detail = customPayload;

    const resp = await lambda.handlerWithParserCallsAnotherMethod(
      testEvent,
      {} as Context
    );

    expect(resp).toEqual(customPayload);
  });
});
