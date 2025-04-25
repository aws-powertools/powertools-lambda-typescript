import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AppSyncEventsResolver,
  UnauthorizedException,
} from '../../src/appsync-events/index.js';
import {
  onPublishEventFactory,
  onSubscribeEventFactory,
} from '../helpers/factories.js';

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

  it('returns null if there are no onSubscribe handlers', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });

    // Act
    const result = await app.resolve(onSubscribeEventFactory(), context);

    // Assess
    expect(console.warn).toHaveBeenCalled();
    expect(result).toEqual(null);
  });

  it('returns the response of the onSubscribe handler', async () => {
    // Prepare
    const app = new AppSyncEventsResolver({ logger: console });
    app.onSubscribe('/foo', async () => true);

    // Act
    const result = await app.resolve(
      onSubscribeEventFactory({ path: '/foo', segments: ['foo'] }),
      context
    );

    // Assess
    expect(result).toBe(true);
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
      app.onSubscribe('/foo', async () => {
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
    app.onSubscribe('/foo', async () => {
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
    app.onPublish('/foo', async (payload) => {
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
      async (payloads) => {
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
      async () => {
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
      async () => {
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
      async () => {
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
