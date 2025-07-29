import context from '@aws-lambda-powertools/testing-utils/context';
import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppSyncGraphQLResolver } from '../../../src/appsync-graphql/AppSyncGraphQLResolver.js';
import {
  InvalidBatchResponseException,
  ResolverNotFoundException,
} from '../../../src/appsync-graphql/index.js';
import { onGraphqlEventFactory } from '../../helpers/factories.js';

describe('Class: AppSyncGraphQLResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs a warning and returns early if the event is not compatible', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });

    // Act
    const result = await app.resolve(null, context);

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'Received an event that is not compatible with this resolver'
    );
    expect(result).toBeUndefined();
  });

  it('throws error if there are no handlers for `Query`', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });

    // Act && Assess
    await expect(
      app.resolve(onGraphqlEventFactory('getPost', 'Query'), context)
    ).rejects.toThrow(
      new ResolverNotFoundException('No resolver found for Query-getPost')
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('throws error if there are no handlers for `Mutation`', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });

    // Act && Assess
    await expect(
      app.resolve(onGraphqlEventFactory('addPost', 'Mutation'), context)
    ).rejects.toThrow(
      new ResolverNotFoundException('No resolver found for Mutation-addPost')
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('throws error if there are no handlers for batch events', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });

    // Act && Assess
    await expect(
      app.resolve([onGraphqlEventFactory('relatedPosts', 'Query')], context)
    ).rejects.toThrow(
      new ResolverNotFoundException(
        'No batch resolver found for Query-relatedPosts'
      )
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('returns the response of the `Query` handler', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });
    app.resolver<{ id: string }>(
      async ({ id }) => {
        return {
          id,
          title: 'Post Title',
          content: 'Post Content',
        };
      },
      {
        fieldName: 'getPost',
      }
    );

    // Act
    const result = await app.resolve(
      onGraphqlEventFactory('getPost', 'Query', { id: '123' }),
      context
    );

    // Assess
    expect(result).toEqual({
      id: '123',
      title: 'Post Title',
      content: 'Post Content',
    });
  });

  it('returns the response of the `Mutation` handler', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });
    app.resolver<{ title: string; content: string }>(
      async ({ title, content }) => {
        return {
          id: '123',
          title,
          content,
        };
      },
      {
        fieldName: 'addPost',
        typeName: 'Mutation',
      }
    );

    // Act
    const result = await app.resolve(
      onGraphqlEventFactory('addPost', 'Mutation', {
        title: 'Post Title',
        content: 'Post Content',
      }),
      context
    );

    // Assess
    expect(console.debug).toHaveBeenNthCalledWith(
      1,
      'Adding resolver for field Mutation.addPost'
    );
    expect(console.debug).toHaveBeenNthCalledWith(
      2,
      'Looking for resolver for type=Mutation, field=addPost'
    );
    expect(result).toEqual({
      id: '123',
      title: 'Post Title',
      content: 'Post Content',
    });
  });

  it('logs only warnings and errors using global console object if no logger supplied', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver();
    app.onMutation<{ title: string; content: string }>(
      'addPost',
      async ({ title, content }) => {
        return {
          id: '123',
          title,
          content,
        };
      }
    );

    // Act
    const result = await app.resolve(
      onGraphqlEventFactory('addPost', 'Mutation', {
        title: 'Post Title',
        content: 'Post Content',
      }),
      context
    );

    // Assess
    expect(console.debug).not.toHaveBeenCalledWith();
    expect(result).toEqual({
      id: '123',
      title: 'Post Title',
      content: 'Post Content',
    });
  });

  it('resolver function has access to event and context', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });
    app.onQuery<{ id: string }>(
      'getPost',
      async ({ id }, { event, context }) => {
        return {
          id,
          event,
          context,
        };
      }
    );

    // Act
    const event = onGraphqlEventFactory('getPost', 'Query', { id: '123' });
    const result = await app.resolve(event, context);

    // Assess
    expect(result).toStrictEqual({
      id: '123',
      event,
      context,
    });
  });

  it('preserves the scope when decorating with `resolver`', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });

    class Lambda {
      public scope = 'scoped';

      @app.onQuery('getPost')
      public async handleGetPost({ id }: { id: string }) {
        return {
          id,
          scope: `${this.scope} id=${id}`,
        };
      }

      @app.onMutation('addPost')
      public async handleAddPost({
        title,
        content,
      }: {
        title: string;
        content: string;
      }) {
        return {
          id: '123',
          title,
          content,
          scope: this.scope,
        };
      }

      public async handler(event: unknown, context: Context) {
        return this.stuff(event, context);
      }

      async stuff(event: unknown, context: Context) {
        return app.resolve(event, context, { scope: this });
      }
    }
    const lambda = new Lambda();
    const handler = lambda.handler.bind(lambda);

    // Act
    const resultQuery = await handler(
      onGraphqlEventFactory('getPost', 'Query', { id: '123' }),
      context
    );
    const resultMutation = await handler(
      onGraphqlEventFactory('addPost', 'Mutation', {
        title: 'Post Title',
        content: 'Post Content',
      }),
      context
    );

    // Assess
    expect(resultQuery).toEqual({
      id: '123',
      scope: 'scoped id=123',
    });
    expect(resultMutation).toEqual({
      id: '123',
      title: 'Post Title',
      content: 'Post Content',
      scope: 'scoped',
    });
  });

  it('preserves the scope when using `batchResolver` decorator', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });

    class Lambda {
      public scope = 'scoped';

      @app.batchResolver({ fieldName: 'batchGet' })
      public async handleBatchGet(
        events: AppSyncResolverEvent<{ id: number }>[]
      ) {
        const ids = events.map((event) => event.arguments.id);
        return ids.map((id) => ({
          id,
          scope: `${this.scope} id=${id}`,
        }));
      }

      public async handler(event: unknown, context: Context) {
        return app.resolve(event, context, { scope: this });
      }
    }
    const lambda = new Lambda();
    const handler = lambda.handler.bind(lambda);

    // Act
    const result = await handler(
      [
        onGraphqlEventFactory('batchGet', 'Query', { id: 1 }),
        onGraphqlEventFactory('batchGet', 'Query', { id: 2 }),
      ],
      context
    );

    // Assess
    expect(result).toEqual([
      { id: 1, scope: 'scoped id=1' },
      { id: 2, scope: 'scoped id=2' },
    ]);
  });

  it.each([
    {
      throwOnError: true,
      description: 'throwOnError=true',
    },
    {
      throwOnError: false,
      description: 'throwOnError=false',
    },
  ])(
    'preserves the scope when using `batchResolver` decorator when aggregate=false and $description',
    async ({ throwOnError }) => {
      // Prepare
      const app = new AppSyncGraphQLResolver({ logger: console });

      class Lambda {
        public scope = 'scoped';

        @app.batchResolver({
          fieldName: 'batchGet',
          throwOnError,
          aggregate: false,
        })
        public async handleBatchGet({ id }: { id: string }) {
          return {
            id,
            scope: `${this.scope} id=${id} throwOnError=${throwOnError} aggregate=false`,
          };
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context, { scope: this });
        }
      }
      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);

      // Act
      const result = await handler(
        [
          onGraphqlEventFactory('batchGet', 'Query', { id: 1 }),
          onGraphqlEventFactory('batchGet', 'Query', { id: 2 }),
        ],
        context
      );

      // Assess
      expect(result).toEqual([
        {
          id: 1,
          scope: `scoped id=1 throwOnError=${throwOnError} aggregate=false`,
        },
        {
          id: 2,
          scope: `scoped id=2 throwOnError=${throwOnError} aggregate=false`,
        },
      ]);
    }
  );

  it('emits debug message when AWS_LAMBDA_LOG_LEVEL is set to DEBUG', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');
    const app = new AppSyncGraphQLResolver();

    class Lambda {
      @app.resolver({ fieldName: 'getPost' })
      public async handleGetPost({ id }: { id: string }) {
        return {
          id,
          title: 'Post Title',
          content: 'Post Content',
        };
      }

      public async handler(event: unknown, context: Context) {
        return app.resolve(event, context, { scope: this });
      }
    }
    const lambda = new Lambda();
    const handler = lambda.handler.bind(lambda);

    // Act
    await handler(
      onGraphqlEventFactory('getPost', 'Query', {
        title: 'Post Title',
        content: 'Post Content',
      }),
      context
    );

    // Assess
    expect(console.debug).toHaveBeenCalled();
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
      const app = new AppSyncGraphQLResolver({ logger: console });
      app.resolver(
        async () => {
          throw error;
        },
        {
          fieldName: 'addPost',
          typeName: 'Mutation',
        }
      );

      // Act
      const result = await app.resolve(
        onGraphqlEventFactory('addPost', 'Mutation', {
          title: 'Post Title',
          content: 'Post Content',
        }),
        context
      );

      // Assess
      expect(result).toEqual({
        error: message,
      });
    }
  );

  it('logs a warning and returns early if one of the batch events is not compatible', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });
    app.batchResolver(vi.fn(), {
      fieldName: 'batchGet',
      typeName: 'Query',
      aggregate: true,
    });

    // Act
    const result = await app.resolve(
      [
        onGraphqlEventFactory('batchGet', 'Query', { id: '1' }),
        {
          key: 'notCompatible',
          type: 'unknown',
        },
      ],
      context
    );

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'Received a batch event that is not compatible with this resolver'
    );
    expect(result).toBeUndefined();
  });

  it.each([
    {
      aggregate: true,
      description: 'aggregate=true',
      setupHandler: (handler: ReturnType<typeof vi.fn>) => {
        handler.mockResolvedValue([
          { id: '1', value: 'A' },
          { id: '2', value: 'B' },
        ]);
      },
    },
    {
      aggregate: false,
      description: 'aggregate=false and throwOnError=true',
      setupHandler: (handler: ReturnType<typeof vi.fn>) => {
        handler
          .mockResolvedValueOnce({ id: '1', value: 'A' })
          .mockResolvedValueOnce({ id: '2', value: 'B' });
      },
    },
  ])(
    'registers a batch resolver via direct function call and invokes it ($description)',
    async ({ aggregate, setupHandler }) => {
      // Prepare
      const app = new AppSyncGraphQLResolver({ logger: console });
      const handler = vi.fn();
      setupHandler(handler);

      if (aggregate) {
        app.batchResolver(handler, {
          fieldName: 'batchGet',
          typeName: 'Query',
          aggregate: true,
        });
      } else {
        app.batchResolver(handler, {
          fieldName: 'batchGet',
          typeName: 'Query',
          aggregate: false,
          throwOnError: true,
        });
      }

      const events = [
        onGraphqlEventFactory('batchGet', 'Query', { id: '1' }),
        onGraphqlEventFactory('batchGet', 'Query', { id: '2' }),
      ];

      // Act
      const result = await app.resolve(events, context);

      // Assess
      if (aggregate) {
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(events, {
          event: events,
          context,
        });
      } else {
        expect(handler).toHaveBeenCalledTimes(2);
        expect(handler).toHaveBeenNthCalledWith(1, events[0].arguments, {
          event: events[0],
          context,
        });
        expect(handler).toHaveBeenNthCalledWith(2, events[1].arguments, {
          event: events[1],
          context,
        });
      }
      expect(result).toEqual([
        { id: '1', value: 'A' },
        { id: '2', value: 'B' },
      ]);
    }
  );

  it('returns null for failed records when aggregate=false', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });
    const handler = vi
      .fn()
      .mockResolvedValueOnce({ id: '1', value: 'A' })
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ id: '3', value: 'C' });

    app.batchResolver(handler, {
      fieldName: 'batchGet',
      typeName: 'Query',
      aggregate: false,
    });
    const events = [
      onGraphqlEventFactory('batchGet', 'Query', { id: '1' }),
      onGraphqlEventFactory('batchGet', 'Query', { id: '2' }),
      onGraphqlEventFactory('batchGet', 'Query', { id: '3' }),
    ];

    // Act
    const result = await app.resolve(events, context);

    // Assess
    expect(console.debug).toHaveBeenNthCalledWith(
      4,
      "Failed to process event #2 from field 'batchGet'"
    );
    expect(result).toEqual([
      { id: '1', value: 'A' },
      null,
      { id: '3', value: 'C' },
    ]);
  });

  it('stops on first error when aggregate=false and throwOnError=true', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });
    const handler = vi
      .fn()
      .mockResolvedValueOnce({ id: '1', value: 'A' })
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ id: '3', value: 'C' });
    app.batchResolver(handler, {
      fieldName: 'batchGet',
      typeName: 'Query',
      aggregate: false,
      throwOnError: true,
    });
    const events = [
      onGraphqlEventFactory('batchGet', 'Query', { id: '1' }),
      onGraphqlEventFactory('batchGet', 'Query', { id: '2' }),
      onGraphqlEventFactory('batchGet', 'Query', { id: '3' }),
    ];

    // Act
    const result = await app.resolve(events, context);

    // Assess
    expect(handler).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      error: 'Error - fail',
    });
  });

  it('throws error if aggregate handler does not return an array', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });
    const handler = vi.fn().mockResolvedValue({ id: '1', value: 'A' });
    app.batchResolver(handler, {
      fieldName: 'batchGet',
      typeName: 'Query',
      aggregate: true,
    });

    // Act && Assess
    await expect(
      app.resolve(
        [onGraphqlEventFactory('batchGet', 'Query', { id: '1' })],
        context
      )
    ).rejects.toThrow(
      new InvalidBatchResponseException(
        'The response must be an array when using batch resolvers'
      )
    );
  });
});
