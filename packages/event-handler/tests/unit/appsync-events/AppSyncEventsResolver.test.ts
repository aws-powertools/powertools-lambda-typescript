import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppSyncEventsResolver,
  UnauthorizedException,
} from '../../../src/appsync-events/index.js';
import type {
  AppSyncEventsSubscribeEvent,
  OnPublishAggregatePayload,
} from '../../../src/types/appsync-events.js';
import {
  onPublishEventFactory,
  onSubscribeEventFactory,
} from '../../helpers/factories.js';

describe('Class: AppSyncEventsResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs a warning and returns early if the event is not compatible', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });

    // Act
    const result = await app.resolve(null, context);

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'Received an event that is not compatible with this resolver'
    );
    expect(result).toBeUndefined();
  });

  it('returns the events unmodified if there are no onPublish handlers', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });

    // Act
    const result = await app.resolve(
      onPublishEventFactory([
        {
          id: '1',
          payload: 'foo',
        },
        {
          id: '2',
          payload: 'bar',
        },
      ]),
      context
    );

    // Assess
    expect(console.warn).toHaveBeenCalled();
    expect(result).toEqual({
      events: [
        {
          id: '1',
          payload: 'foo',
        },
        {
          id: '2',
          payload: 'bar',
        },
      ],
    });
  });

  it.each([
    { aggregate: true, channel: { path: '/foo', segments: ['foo'] } },
    {
      aggregate: false,
      channel: {
        path: '/bar',
        segments: ['bar'],
      },
    },
  ])(
    'preserves the scope when decorating with onPublish aggregate=$aggregate',
    async ({ aggregate, channel }) => {
      // Prepare
      const app = new AppSyncEventsResolver({ logger: console });

      class Lambda {
        public scope = 'scoped';

        @app.onPublish('/foo', { aggregate })
        public handleFoo(payloads: OnPublishAggregatePayload) {
          return payloads.map((payload) => {
            return {
              id: payload.id,
              payload: `${this.scope} ${payload.payload}`,
            };
          });
        }

        @app.onPublish('/bar')
        public handleBar(payload: string) {
          return `${this.scope} ${payload}`;
        }

        public handler(event: unknown, context: Context) {
          return this.stuff(event, context);
        }

        stuff(event: unknown, context: Context) {
          return app.resolve(event, context, { scope: this });
        }
      }
      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);

      // Act
      const result = await handler(
        onPublishEventFactory(
          [
            {
              id: '1',
              payload: 'foo',
            },
          ],
          channel
        ),
        context
      );

      // Assess
      expect(result).toEqual({
        events: [
          {
            id: '1',
            payload: 'scoped foo',
          },
        ],
      });
    }
  );

  it('preserves the scope when decorating with onSubscribe', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });

    class Lambda {
      public scope = 'scoped';

      @app.onSubscribe('/foo')
      public handleFoo(payload: AppSyncEventsSubscribeEvent) {
        console.debug(`${this.scope} ${payload.info.channel.path}`);
      }

      public handler(event: unknown, context: Context) {
        return this.stuff(event, context);
      }

      stuff(event: unknown, context: Context) {
        return app.resolve(event, context, { scope: this });
      }
    }
    const lambda = new Lambda();
    const handler = lambda.handler.bind(lambda);

    // Act
    await handler(
      onSubscribeEventFactory({
        path: '/foo',
        segments: ['foo'],
      }),
      context
    );

    // Assess
    expect(console.debug).toHaveBeenCalledWith('scoped /foo');
  });

  it('returns null if there are no onSubscribe handlers', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });

    // Act
    const result = await app.resolve(onSubscribeEventFactory(), context);

    // Assess
    expect(console.warn).toHaveBeenCalled();
    expect(result).toEqual(null);
  });

  it('ignores the response of the onSubscribe handler', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });
    app.onSubscribe('/foo', async () => true);

    // Act
    const result = await app.resolve(
      onSubscribeEventFactory({ path: '/foo', segments: ['foo'] }),
      context
    );

    // Assess
    expect(result).toBe(undefined);
  });

  it.each([
    {
      type: 'base error',
      error: new Error('Error in handler'),
      message: 'Error - Error in handler',
    },
    {
      type: 'syntax error',
      error: new SyntaxError('Syntax error in handler'),
      message: 'SyntaxError - Syntax error in handler',
    },
    {
      type: 'unknown error',
      error: 'foo',
      message: 'An unknown error occurred',
    },
  ])(
    'formats the error thrown by the onSubscribe handler $type',
    async ({ error, message }) => {
      // Prepare
      const app = new AppSyncEventsResolver({ logger: console });
      app.onSubscribe('/foo', () => {
        throw error;
      });

      // Act
      const result = await app.resolve(
        onSubscribeEventFactory({ path: '/foo', segments: ['foo'] }),
        context
      );

      // Assess
      expect(result).toEqual({
        error: message,
      });
    }
  );

  it('throws an UnauthorizedException when thrown by the handler', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });
    app.onSubscribe('/foo', () => {
      throw new UnauthorizedException('nah');
    });

    // Act & Assess
    await expect(
      app.resolve(
        onSubscribeEventFactory({ path: '/foo', segments: ['foo'] }),
        context
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('returns the response of the onPublish handler', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });
    app.onPublish('/foo', (payload) => {
      if (payload === 'foo') {
        return true;
      }
      throw new Error('Error in handler');
    });

    // Act
    const result = await app.resolve(
      onPublishEventFactory(
        [
          {
            id: '1',
            payload: 'foo',
          },
          {
            id: '2',
            payload: 'bar',
          },
        ],
        { path: '/foo', segments: ['foo'] }
      ),
      context
    );

    // Assess
    expect(result).toEqual({
      events: [
        {
          id: '1',
          payload: true,
        },
        {
          id: '2',
          error: 'Error - Error in handler',
        },
      ],
    });
  });

  it('calls the onPublish handler with aggregate set to true', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });
    app.onPublish(
      '/foo',
      (payloads) => {
        return payloads.map((payload) => ({
          id: payload.id,
          payload: true,
        }));
      },
      { aggregate: true }
    );

    // Act
    const result = await app.resolve(
      onPublishEventFactory(
        [
          {
            id: '1',
            payload: 'foo',
          },
          {
            id: '2',
            payload: 'bar',
          },
        ],
        {
          path: '/foo',
          segments: ['foo'],
        }
      ),
      context
    );

    // Assess
    expect(result).toEqual({
      events: [
        {
          id: '1',
          payload: true,
        },
        {
          id: '2',
          payload: true,
        },
      ],
    });
  });

  it('formats the error thrown by an aggregate onPublish handler', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });
    app.onPublish(
      '/foo',
      () => {
        throw new Error('Error in handler');
      },
      { aggregate: true }
    );

    // Act
    const result = await app.resolve(
      onPublishEventFactory(undefined, {
        path: '/foo',
        segments: ['foo'],
      }),
      context
    );

    // Assess
    expect(result).toEqual({
      error: 'Error - Error in handler',
    });
  });

  it('throws an UnauthorizedException when thrown by the aggregate onPublish handler', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });
    app.onPublish(
      '/foo',
      () => {
        throw new UnauthorizedException('nah');
      },
      { aggregate: true }
    );

    // Act & Assess
    await expect(
      app.resolve(
        onPublishEventFactory(undefined, { path: '/foo', segments: ['foo'] }),
        context
      )
    ).rejects.toThrow(UnauthorizedException);
    expect(console.error).toHaveBeenCalled();
  });

  it('logs the error even if the logger is not provided', async () => {
    // Prepare
    const app = new AppSyncEventsResolver();
    app.onPublish(
      '/foo',
      () => {
        throw new Error('Error in handler');
      },
      { aggregate: true }
    );

    // Act
    await app.resolve(
      onPublishEventFactory(undefined, { path: '/foo', segments: ['foo'] }),
      context
    );

    // Assess
    expect(console.error).toHaveBeenCalled();
  });
});
