import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import middy from '@middy/core';
import type { Context, Handler } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { EventBridgeWithMetadataEnvelope } from '../../src/envelopes/index.js';
import { parser } from '../../src/index.js';
import { parser as parserMiddleware } from '../../src/middleware/index.js';
import type { ParsedResult } from '../../src/types/index.js';
import { makeEventBridgeWithMetadataRecord } from './helpers/utils.js';

describe('Integration: EventBridge WITH_METADATA', () => {
  const schema = z.object({ orderId: z.string().transform(Number) });
  type Order = z.infer<typeof schema>;

  it('passes transformed detail arrays through the decorator', async () => {
    // Prepare
    class Lambda implements LambdaInterface {
      @parser({ schema, envelope: EventBridgeWithMetadataEnvelope })
      public async handler(event: Order[], _context: Context) {
        return event;
      }
    }
    // Invoke through the Lambda boundary, which receives the unparsed event.
    const lambda: LambdaInterface = new Lambda();
    const event = [makeEventBridgeWithMetadataRecord({ orderId: '42' })];

    // Act
    const result = await lambda.handler(event, {} as Context, () => {});

    // Assess
    expect(result).toEqual([{ orderId: 42 }]);
  });

  it('passes transformed detail arrays through middleware', async () => {
    // Prepare
    const handler: Handler = middy()
      .use(
        parserMiddleware({ schema, envelope: EventBridgeWithMetadataEnvelope })
      )
      .handler(async (event) => event);
    const event = [makeEventBridgeWithMetadataRecord({ orderId: '42' })];

    // Act
    const result = await handler(event, {} as Context, () => {});

    // Assess
    expect(result).toEqual([{ orderId: 42 }]);
  });

  it('passes a failed result through the decorator for a throwing transform', async () => {
    // Prepare
    const cause = new SyntaxError('invalid JSON');
    const throwingSchema = z.unknown().transform(() => {
      throw cause;
    });
    class Lambda implements LambdaInterface {
      @parser({
        schema: throwingSchema,
        envelope: EventBridgeWithMetadataEnvelope,
        safeParse: true,
      })
      public async handler(
        event: ParsedResult<unknown, never[]>,
        _context: Context
      ) {
        return event;
      }
    }
    const lambda: LambdaInterface = new Lambda();
    const event = [makeEventBridgeWithMetadataRecord({})];

    // Act
    const result = await lambda.handler(event, {} as Context, () => {});

    // Assess
    expect(result).toMatchObject({
      success: false,
      originalEvent: event,
      error: { cause },
    });
  });

  it('passes a failed result through middleware for a throwing transform', async () => {
    // Prepare
    const cause = new SyntaxError('invalid JSON');
    const throwingSchema = z.unknown().transform(() => {
      throw cause;
    });
    const handler: Handler = middy()
      .use(
        parserMiddleware({
          schema: throwingSchema,
          envelope: EventBridgeWithMetadataEnvelope,
          safeParse: true,
        })
      )
      .handler(async (event) => event);
    const event = [makeEventBridgeWithMetadataRecord({})];

    // Act
    const result = await handler(event, {} as Context, () => {});

    // Assess
    expect(result).toMatchObject({
      success: false,
      originalEvent: event,
      error: { cause },
    });
  });
});
