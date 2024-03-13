/**
 * Test decorator parser
 *
 * @group unit/parser
 */

import type { LambdaInterface } from '@aws-lambda-powertools/commons/lib/esm/types';
import { Context, EventBridgeEvent } from 'aws-lambda';
import { parser } from '../../src/index.js';
import { TestSchema, TestEvents } from './schema/utils';
import { generateMock } from '@anatine/zod-mock';
import { eventBridgeEnvelope } from '../../src/envelopes/index.js';
import { EventBridgeSchema } from '../../src/schemas/index.js';
import { z, SafeParseReturnType } from 'zod';

describe('Parser Decorator', () => {
  const customEventBridgeSchema = EventBridgeSchema.extend({
    detail: TestSchema,
  });

  type TestEvent = z.infer<typeof TestSchema>;

  class TestClass implements LambdaInterface {
    @parser({ schema: TestSchema })
    public async handler(
      event: TestEvent,
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
      event: TestEvent,
      _context: Context
    ): Promise<unknown> {
      return this.anotherMethod(event as TestEvent);
    }

    @parser({ envelope: eventBridgeEnvelope, schema: TestSchema })
    public async handlerWithSchemaAndEnvelope(
      event: TestEvent,
      _context: Context
    ): Promise<unknown> {
      return event;
    }

    @parser({
      schema: TestSchema,
      safeParse: true,
    })
    public async handlerWithSchemaAndSafeParse(
      event: SafeParseReturnType<unknown, TestEvent>,
      _context: Context
    ): Promise<unknown> {
      if (!event.success) {
        return event.error;
      } else {
        return event.data;
      }
    }

    private async anotherMethod(event: TestEvent): Promise<TestEvent> {
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      testEvent,
      {} as Context
    );

    expect(resp).toEqual(customPayload);
  });

  it('should parse event with schema and safeParse', async () => {
    const testEvent = generateMock(TestSchema);

    const resp = await lambda.handlerWithSchemaAndSafeParse(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      testEvent,
      {} as Context
    );

    expect(resp).toEqual(testEvent);
  });
});
