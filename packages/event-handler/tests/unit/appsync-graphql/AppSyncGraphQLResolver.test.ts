import context from '@aws-lambda-powertools/testing-utils/context';
import { AssertionError } from 'assert';
import type { AppSyncResolverEvent, Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppSyncGraphQLResolver } from '../../../src/appsync-graphql/AppSyncGraphQLResolver.js';
import {
  InvalidBatchResponseException,
  ResolverNotFoundException,
} from '../../../src/appsync-graphql/index.js';
import type { ErrorClass } from '../../../src/types/appsync-graphql.js';
import { onGraphqlEventFactory } from '../../helpers/factories.js';

class ValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValidationError';
  }
}
class NotFoundError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NotFoundError';
  }
}
class DatabaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}

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
        app.onBatchQuery('batchGet', handler, {
          aggregate: true,
        });
      } else {
        app.onBatchQuery('batchGet', handler, {
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
    app.onBatchMutation('batchPut', handler, {
      aggregate: false,
      throwOnError: true,
    });
    const events = [
      onGraphqlEventFactory('batchPut', 'Mutation', { id: '1' }),
      onGraphqlEventFactory('batchPut', 'Mutation', { id: '2' }),
      onGraphqlEventFactory('batchPut', 'Mutation', { id: '3' }),
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
    'preserves the scope when using `onBatchQuery` & `onBatchMutation` decorators when aggregate=false and $description',
    async ({ throwOnError }) => {
      // Prepare
      const app = new AppSyncGraphQLResolver({ logger: console });

      class Lambda {
        public readonly scope = 'scoped';

        @app.onBatchQuery('batchGet', {
          throwOnError,
        })
        public async handleBatchGet(
          events: AppSyncResolverEvent<{ id: number }>[]
        ) {
          const ids = events.map((event) => event.arguments.id);
          return ids.map((id) => ({
            id,
            scope: this.scope,
          }));
        }

        @app.onBatchMutation('batchPut', {
          throwOnError,
        })
        public async handleBatchPut(
          _events: AppSyncResolverEvent<{ id: number }>[]
        ) {
          return [this.scope, this.scope];
        }

        public async handler(event: unknown, context: Context) {
          return app.resolve(event, context, { scope: this });
        }
      }
      const lambda = new Lambda();
      const handler = lambda.handler.bind(lambda);

      // Act
      const resultQuery = await handler(
        [
          onGraphqlEventFactory('batchGet', 'Query', { id: 1 }),
          onGraphqlEventFactory('batchGet', 'Query', { id: 2 }),
        ],
        context
      );
      const resultMutation = await handler(
        [
          onGraphqlEventFactory('batchPut', 'Mutation', { id: 1 }),
          onGraphqlEventFactory('batchPut', 'Mutation', { id: 2 }),
        ],
        context
      );

      // Assess
      expect(resultQuery).toEqual([
        { id: 1, scope: 'scoped' },
        { id: 2, scope: 'scoped' },
      ]);
      expect(resultMutation).toEqual(['scoped', 'scoped']);
    }
  );

  // #region Exception Handling

  it.each([
    {
      errorClass: EvalError,
      message: 'Evaluation failed',
    },
    {
      errorClass: RangeError,
      message: 'Range failed',
    },
    {
      errorClass: ReferenceError,
      message: 'Reference failed',
    },
    {
      errorClass: SyntaxError,
      message: 'Syntax missing',
    },
    {
      errorClass: TypeError,
      message: 'Type failed',
    },
    {
      errorClass: URIError,
      message: 'URI failed',
    },
    {
      errorClass: AggregateError,
      message: 'Aggregation failed',
    },
  ])(
    'should invoke exception handler for %s',
    async ({
      errorClass,
      message,
    }: {
      errorClass: ErrorClass<Error>;
      message: string;
    }) => {
      // Prepare
      const app = new AppSyncGraphQLResolver();

      app.exceptionHandler(errorClass, async (err) => {
        return {
          message,
          errorName: err.constructor.name,
        };
      });

      app.onQuery('getUser', async () => {
        throw errorClass === AggregateError
          ? new errorClass([new Error()], message)
          : new errorClass(message);
      });

      // Act
      const result = await app.resolve(
        onGraphqlEventFactory('getUser', 'Query', {}),
        context
      );

      // Assess
      expect(result).toEqual({
        message,
        errorName: errorClass.name,
      });
    }
  );

  it('should handle multiple different error types with specific exception handlers', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver();

    app.exceptionHandler(ValidationError, async (error) => {
      return {
        message: 'Validation failed',
        details: error.message,
        type: 'validation_error',
      };
    });

    app.exceptionHandler(NotFoundError, async (error) => {
      return {
        message: 'Resource not found',
        details: error.message,
        type: 'not_found_error',
      };
    });

    app.onQuery<{ id: string }>('getUser', async ({ id }) => {
      if (!id) {
        throw new ValidationError('User ID is required');
      }
      if (id === '0') {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
      return { id, name: 'John Doe' };
    });

    // Act
    const validationResult = await app.resolve(
      onGraphqlEventFactory('getUser', 'Query', {}),
      context
    );
    const notFoundResult = await app.resolve(
      onGraphqlEventFactory('getUser', 'Query', { id: '0' }),
      context
    );

    // Asses
    expect(validationResult).toEqual({
      message: 'Validation failed',
      details: 'User ID is required',
      type: 'validation_error',
    });
    expect(notFoundResult).toEqual({
      message: 'Resource not found',
      details: 'User with ID 0 not found',
      type: 'not_found_error',
    });
  });

  it('should prefer exact error class match over inheritance match during exception handling', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver();

    app.exceptionHandler(Error, async (error) => {
      return {
        message: 'Generic error occurred',
        details: error.message,
        type: 'generic_error',
      };
    });

    app.exceptionHandler(ValidationError, async (error) => {
      return {
        message: 'Validation failed',
        details: error.message,
        type: 'validation_error',
      };
    });

    app.onQuery('getUser', async () => {
      throw new ValidationError('Specific validation error');
    });

    // Act
    const result = await app.resolve(
      onGraphqlEventFactory('getUser', 'Query', {}),
      context
    );

    // Assess
    expect(result).toEqual({
      message: 'Validation failed',
      details: 'Specific validation error',
      type: 'validation_error',
    });
  });

  it('should fall back to default error formatting when no exception handler is found', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver();

    app.exceptionHandler(AssertionError, async (error) => {
      return {
        message: 'Validation failed',
        details: error.message,
        type: 'validation_error',
      };
    });

    app.onQuery('getUser', async () => {
      throw new DatabaseError('Database connection failed');
    });

    // Act
    const result = await app.resolve(
      onGraphqlEventFactory('getUser', 'Query', {}),
      context
    );

    // Assess
    expect(result).toEqual({
      error: 'DatabaseError - Database connection failed',
    });
  });

  it('should fall back to default error formatting when exception handler throws an error', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });
    const errorToBeThrown = new Error('Exception handler failed');

    app.exceptionHandler(ValidationError, async () => {
      throw errorToBeThrown;
    });

    app.onQuery('getUser', async () => {
      throw new ValidationError('Original error');
    });

    // Act
    const result = await app.resolve(
      onGraphqlEventFactory('getUser', 'Query', {}),
      context
    );

    // Assess
    expect(result).toEqual({
      error: 'ValidationError - Original error',
    });
    expect(console.error).toHaveBeenNthCalledWith(
      1,
      'An error occurred in handler getUser',
      new ValidationError('Original error')
    );
    expect(console.error).toHaveBeenNthCalledWith(
      2,
      'Exception handler for ValidationError threw an error',
      errorToBeThrown
    );
  });

  it('should invoke sync exception handlers and return their result', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver();

    app.exceptionHandler(ValidationError, (error) => {
      return {
        message: 'This is a sync handler',
        details: error.message,
        type: 'sync_validation_error',
      };
    });

    app.onQuery('getUser', async () => {
      throw new ValidationError('Sync error test');
    });

    // Act
    const result = await app.resolve(
      onGraphqlEventFactory('getUser', 'Query', {}),
      context
    );

    // Assess
    expect(result).toEqual({
      message: 'This is a sync handler',
      details: 'Sync error test',
      type: 'sync_validation_error',
    });
  });

  it('should not interfere with ResolverNotFoundException during exception handling', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver();

    app.exceptionHandler(RangeError, async (error) => {
      return {
        message: 'This should not be called',
        details: error.message,
        type: 'should_not_happen',
      };
    });

    // Act & Assess
    await expect(
      app.resolve(
        onGraphqlEventFactory('nonExistentResolver', 'Query'),
        context
      )
    ).rejects.toThrow('No resolver found for Query-nonExistentResolver');
  });

  it('should work as a method decorator for `exceptionHandler`', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver();

    class Lambda {
      @app.exceptionHandler(ValidationError)
      async handleValidationError(error: ValidationError) {
        return {
          message: 'Decorator validation failed',
          details: error.message,
          type: 'decorator_validation_error',
        };
      }

      @app.exceptionHandler(NotFoundError)
      handleNotFoundError(error: NotFoundError) {
        return {
          message: 'Decorator user not found',
          details: error.message,
          type: 'decorator_user_not_found',
        };
      }

      @app.onQuery('getUser')
      async getUser({ id, name }: { id: string; name: string }) {
        if (!id) {
          throw new ValidationError('Decorator error test');
        }
        if (id === '0') {
          throw new NotFoundError(`User with ID ${id} not found`);
        }
        return { id, name };
      }

      async handler(event: unknown, context: Context) {
        return app.resolve(event, context, {
          scope: this,
        });
      }
    }

    const lambda = new Lambda();
    const handler = lambda.handler.bind(lambda);

    // Act
    const validationError = await handler(
      onGraphqlEventFactory('getUser', 'Query', {}),
      context
    );
    const notFoundError = await handler(
      onGraphqlEventFactory('getUser', 'Query', { id: '0', name: 'John Doe' }),
      context
    );

    // Assess
    expect(validationError).toEqual({
      message: 'Decorator validation failed',
      details: 'Decorator error test',
      type: 'decorator_validation_error',
    });
    expect(notFoundError).toEqual({
      message: 'Decorator user not found',
      details: 'User with ID 0 not found',
      type: 'decorator_user_not_found',
    });
  });

  // #endregion Exception handling
});
