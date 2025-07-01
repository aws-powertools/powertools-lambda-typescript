import { Router } from 'src/appsync-graphql/Router.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Class: Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers resolvers using the functional approach', () => {
    // Prepare
    const app = new Router({ logger: console });
    const getPost = vi.fn(() => [true]);
    const addPost = vi.fn(async () => true);

    // Act
    app.onQuery('getPost', getPost);
    app.onMutation('addPost', addPost);

    // Assess
    expect(console.debug).toHaveBeenNthCalledWith(
      1,
      'Adding resolver for field Query.getPost'
    );
    expect(console.debug).toHaveBeenNthCalledWith(
      2,
      'Adding resolver for field Mutation.addPost'
    );
  });

  it('registers resolvers using the decorator pattern', () => {
    // Prepare
    const app = new Router({ logger: console });

    // Act
    class Lambda {
      readonly prop = 'value';

      @app.resolver({ fieldName: 'getPost' })
      public getPost() {
        return `${this.prop} foo`;
      }

      @app.resolver({ fieldName: 'getAuthor' })
      public getAuthor() {
        return `${this.prop} bar`;
      }

      @app.onMutation('addPost')
      public addPost() {
        return `${this.prop} bar`;
      }

      @app.resolver({ fieldName: 'updatePost', typeName: 'Mutation' })
      public updatePost() {
        return `${this.prop} baz`;
      }
    }
    const lambda = new Lambda();
    const res1 = lambda.getPost();
    const res2 = lambda.getAuthor();
    const res3 = lambda.addPost();
    const res4 = lambda.updatePost();

    // Assess
    expect(console.debug).toHaveBeenNthCalledWith(
      1,
      'Adding resolver for field Query.getPost'
    );
    expect(console.debug).toHaveBeenNthCalledWith(
      2,
      'Adding resolver for field Query.getAuthor'
    );
    expect(console.debug).toHaveBeenNthCalledWith(
      3,
      'Adding resolver for field Mutation.addPost'
    );
    expect(console.debug).toHaveBeenNthCalledWith(
      4,
      'Adding resolver for field Mutation.updatePost'
    );

    // verify that class scope is preserved after decorating
    expect(res1).toBe('value foo');
    expect(res2).toBe('value bar');
    expect(res3).toBe('value bar');
    expect(res4).toBe('value baz');
  });

  it('registers nested resolvers using the decorator pattern', () => {
    // Prepare
    const app = new Router({ logger: console });

    // Act
    class Lambda {
      @app.onQuery('listLocations')
      @app.onQuery('locations')
      public getLocations() {
        return [
          {
            name: 'Location 1',
            description: 'Description 1',
          },
        ];
      }
    }

    const lambda = new Lambda();
    const response = lambda.getLocations();

    // Assess
    expect(console.debug).toHaveBeenNthCalledWith(
      1,
      'Adding resolver for field Query.locations'
    );
    expect(console.debug).toHaveBeenNthCalledWith(
      2,
      'Adding resolver for field Query.listLocations'
    );

    expect(response).toEqual([
      { name: 'Location 1', description: 'Description 1' },
    ]);
  });

  it('uses a default logger with only warnings if none is provided', () => {
    // Prepare
    const app = new Router();

    // Act
    app.resolver(vi.fn(), { fieldName: 'getPost' });

    // Assess
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('emits debug messages when ALC_LOG_LEVEL is set to DEBUG', () => {
    // Prepare
    process.env.AWS_LAMBDA_LOG_LEVEL = 'DEBUG';
    const router = new Router();

    // Act
    router.resolver(vi.fn(), { fieldName: 'getPost' });

    // Assess
    expect(console.debug).toHaveBeenCalled();
    process.env.AWS_LAMBDA_LOG_LEVEL = undefined;
  });
});
