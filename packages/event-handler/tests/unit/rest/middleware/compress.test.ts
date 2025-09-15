import context from '@aws-lambda-powertools/testing-utils/context';
import { Router } from 'src/rest/Router.js';
import type { Middleware } from 'src/types/index.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { compress } from '../../../../src/rest/middleware/index.js';
import { createSettingHeadersMiddleware, createTestEvent } from '../helpers.js';

describe('Compress Middleware', () => {
  it('compresses response when conditions are met', async () => {
    // Prepare
    const event = createTestEvent('/test', 'GET');
    const app = new Router();
    app.get(
      '/test',
      [
        compress(),
        createSettingHeadersMiddleware({
          'content-length': '2000',
        }),
      ],
      async () => {
        return { test: 'x'.repeat(2000) };
      }
    );

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBe('gzip');
    expect(result.headers?.['content-length']).toBeUndefined();
  });

  it('skips compression when content is below threshold', async () => {
    // Prepare
    const event = createTestEvent('/test', 'GET');
    const app = new Router();
    app.get(
      '/test',
      [
        compress({ threshold: 1024 }),
        createSettingHeadersMiddleware({
          'content-length': '1',
        }),
      ],
      async () => {
        return { test: 'x' };
      }
    );

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
  });

  it('skips compression for HEAD requests', async () => {
    // Prepare
    const event = createTestEvent('/test', 'HEAD');
    const app = new Router();
    app.head(
      '/test',
      [
        compress(),
        createSettingHeadersMiddleware({
          'content-length': '2000',
        }),
      ],
      async () => {
        return { test: 'x'.repeat(2000) };
      }
    );

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
  });

  it('skips compression when already encoded', async () => {
    // Prepare
    const event = createTestEvent('/test', 'GET');
    const app = new Router();
    app.get(
      '/test',
      [
        compress({
          encoding: 'deflate',
        }),
        compress({
          encoding: 'gzip',
        }),
        createSettingHeadersMiddleware({
          'content-length': '2000',
        }),
      ],
      async () => {
        return { test: 'x'.repeat(2000) };
      }
    );

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toEqual('gzip');
  });

  it('skips compression for non-compressible content types', async () => {
    // Prepare
    const event = createTestEvent('/test', 'GET');
    const app = new Router();
    app.get(
      '/test',
      [
        compress(),
        createSettingHeadersMiddleware({
          'content-length': '2000',
          'content-type': 'image/jpeg',
        }),
      ],
      async () => {
        return { test: 'x'.repeat(2000) };
      }
    );

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
  });

  it('skips compression when cache-control no-transform is set', async () => {
    // Prepare
    const event = createTestEvent('/test', 'GET');
    const app = new Router();
    app.get(
      '/test',
      [
        compress(),
        createSettingHeadersMiddleware({
          'content-length': '2000',
          'cache-control': 'no-transform',
        }),
      ],
      async () => {
        return { test: 'x'.repeat(2000) };
      }
    );

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
  });

  it('uses specified encoding when provided', async () => {
    // Prepare
    const event = createTestEvent('/test', 'GET');
    const app = new Router();
    app.get(
      '/test',
      [
        compress({
          encoding: 'deflate',
        }),
        createSettingHeadersMiddleware({
          'content-length': '2000',
        }),
      ],
      async () => {
        return { test: 'x'.repeat(2000) };
      }
    );

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBe('deflate');
  });

  it('infers encoding from Accept-Encoding header', async () => {
    // Prepare
    const event = createTestEvent('/test', 'GET', {
      'Accept-Encoding': 'deflate',
    });
    const app = new Router();
    app.get(
      '/test',
      [
        compress(),
        createSettingHeadersMiddleware({
          'content-length': '2000',
        }),
      ],
      async () => {
        return { test: 'x'.repeat(2000) };
      }
    );

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBe('deflate');
  });
});
