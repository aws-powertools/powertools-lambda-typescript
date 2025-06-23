import context from '@aws-lambda-powertools/testing-utils/context';
import { onGraphqlEventFactory } from 'tests/helpers/factories.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppSyncGraphQLResolver } from '../../../src/appsync-graphql/AppSyncGraphQLResolver.js';
import { ResolverNotFoundException } from '../../../src/appsync-graphql/errors.js';

describe('Class: AppSyncGraphQLResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs a warning and returns early if the event is batched', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });

    // Act
    const result = await app.resolve(
      [onGraphqlEventFactory('getPost', 'Query')],
      context
    );

    // Assess
    expect(console.warn).toHaveBeenCalledWith(
      'Batch resolver is not implemented yet'
    );
    expect(result).toBeUndefined();
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

  it('throws error if there are no onQuery handlers', async () => {
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

  it('throws error if there are no onMutation handlers', async () => {
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

  it('returns the response of the onQuery handler', async () => {
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

  it('returns the response of the onMutation handler', async () => {
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
    expect(console.debug).not.toHaveBeenCalledWith();
    expect(console.debug).not.toHaveBeenCalledWith();
    expect(result).toEqual({
      id: '123',
      title: 'Post Title',
      content: 'Post Content',
    });
  });

  it('emits debug message when AWS_LAMBDA_LOG_LEVEL is set to DEBUG', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');
    const app = new AppSyncGraphQLResolver();

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
    await app.resolve(
      onGraphqlEventFactory('addPost', 'Mutation', {
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
});
