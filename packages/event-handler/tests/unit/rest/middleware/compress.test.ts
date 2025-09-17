import { gzipSync } from 'node:zlib';
import context from '@aws-lambda-powertools/testing-utils/context';
import { Router } from 'src/rest/Router.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { compress } from '../../../../src/rest/middleware/index.js';
import { createSettingHeadersMiddleware, createTestEvent } from '../helpers.js';

describe('Compress Middleware', () => {
  const event = createTestEvent('/test', 'GET');
  let app: Router;
  const body = { test: 'x'.repeat(2000) };

  beforeEach(() => {
    app = new Router();
    app.use(compress());
    app.use(
      createSettingHeadersMiddleware({
        'content-length': '2000',
      })
    );
  });

  it('compresses response when conditions are met', async () => {
    // Prepare
    app.get('/test', async () => {
      return body;
    });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBe('gzip');
    expect(result.headers?.['content-length']).toBeUndefined();
    expect(result.body).toEqual(
      gzipSync(JSON.stringify(body)).toString('base64')
    );
  });

  it('skips compression when content is below threshold', async () => {
    // Prepare
    const application = new Router();
    application.get(
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
    const result = await application.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
  });

  it('skips compression for HEAD requests', async () => {
    // Prepare
    const headEvent = createTestEvent('/test', 'HEAD');
    app.head('/test', async () => {
      return body;
    });

    // Act
    const result = await app.resolve(headEvent, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
  });

  it('skips compression when already encoded', async () => {
    // Prepare
    const application = new Router();
    application.get(
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
        return body;
      }
    );

    // Act
    const result = await application.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toEqual('gzip');
  });

  it('skips compression when cache-control no-transform is set', async () => {
    // Prepare
    const application = new Router();
    application.get(
      '/test',
      [
        compress(),
        createSettingHeadersMiddleware({
          'content-length': '2000',
          'cache-control': 'no-transform',
        }),
      ],
      async () => {
        return body;
      }
    );

    // Act
    const result = await application.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
  });

  it('uses specified encoding when provided', async () => {
    // Prepare
    const application = new Router();
    application.get(
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
        return body;
      }
    );

    // Act
    const result = await application.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBe('deflate');
  });

  it('does not compress if Accept-Encoding is set to identity', async () => {
    // Prepare
    const deflateCompressionEvent = createTestEvent('/test', 'GET', {
      'Accept-Encoding': 'identity',
    });
    app.get('/test', async () => {
      return body;
    });

    // Act
    const result = await app.resolve(deflateCompressionEvent, context);

    // Assess
    expect(result.headers?.['content-encoding']).not.toBeDefined;
  });
});
