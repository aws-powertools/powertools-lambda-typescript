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

  it.each([
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'application/zip',
    'application/gzip',
    'application/x-gzip',
    'application/octet-stream',
    'application/pdf',
    'application/msword',
    'text/event-stream',
  ])(
    'skips compression for non-compressible content types',
    async (contentType) => {
      // Prepare
      const application = new Router();
      application.get(
        '/test',
        [
          compress(),
          createSettingHeadersMiddleware({
            'content-length': '2000',
            'content-type': contentType,
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
    }
  );

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

  it('infers encoding from Accept-Encoding header', async () => {
    // Prepare
    const deflateCompressionEvent = createTestEvent('/test', 'GET', {
      'Accept-Encoding': 'deflate',
    });
    app.get('/test', async () => {
      return body;
    });

    // Act
    const result = await app.resolve(deflateCompressionEvent, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBe('deflate');
  });
});
