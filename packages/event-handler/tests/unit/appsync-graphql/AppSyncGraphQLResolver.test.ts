import context from '@aws-lambda-powertools/testing-utils/context';
import {
  onMutationEventFactory,
  onQueryEventFactory,
} from 'tests/helpers/factories.js';
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
    const result = await app.resolve([onQueryEventFactory()], context);

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

  it('throw error if there are no onQuery handlers', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });

    // Act && Assess
    await expect(
      app.resolve(onQueryEventFactory('getPost'), context)
    ).rejects.toThrow(
      new ResolverNotFoundException(
        'No resolver found for the event getPost-Query.'
      )
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('throw error if there are no onMutation handlers', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });

    // Act && Assess
    await expect(
      app.resolve(onMutationEventFactory('addPost'), context)
    ).rejects.toThrow(
      new ResolverNotFoundException(
        'No resolver found for the event addPost-Mutation.'
      )
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('returns the response of the onQuery handler', async () => {
    // Prepare
    const app = new AppSyncGraphQLResolver({ logger: console });
    app.onQuery('getPost', async ({ id }) => {
      return {
        id,
        title: 'Post Title',
        content: 'Post Content',
      };
    });

    // Act
    const result = await app.resolve(
      onQueryEventFactory('getPost', { id: '123' }),
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
    app.onMutation('addPost', async ({ title, content }) => {
      return {
        id: '123',
        title,
        content,
      };
    });

    // Act
    const result = await app.resolve(
      onMutationEventFactory('addPost', {
        title: 'Post Title',
        content: 'Post Content',
      }),
      context
    );

    // Assess
    expect(result).toEqual({
      id: '123',
      title: 'Post Title',
      content: 'Post Content',
    });
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
      app.onMutation('addPost', async () => {
        throw error;
      });

      // Act
      const result = await app.resolve(
        onMutationEventFactory('addPost', {
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
