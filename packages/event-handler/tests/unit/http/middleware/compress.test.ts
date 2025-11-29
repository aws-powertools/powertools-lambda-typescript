import { deflateSync, gunzipSync, gzipSync } from 'node:zlib';
import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it } from 'vitest';
import { streamify } from '../../../../src/http/index.js';
import { compress } from '../../../../src/http/middleware/index.js';
import { Router } from '../../../../src/http/Router.js';
import {
  createSettingHeadersMiddleware,
  createTestEvent,
  ResponseStream,
} from '../helpers.js';

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
    app.get('/test', () => {
      return body;
    });

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBe('gzip');
    expect(result.headers?.['content-length']).toBeUndefined();
    expect(result.isBase64Encoded).toBe(true);
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
      () => {
        return { test: 'x' };
      }
    );

    // Act
    const result = await application.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
    expect(result.isBase64Encoded).toBe(false);
  });

  it('skips compression when content is below threshold and content-length is not set', async () => {
    // Prepare
    const application = new Router();
    const smallBody = { message: 'Small' };

    application.use(compress({ threshold: 100 }));
    application.get('/test', () => {
      return smallBody;
    });

    // Act
    const result = await application.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
    expect(result.isBase64Encoded).toBe(false);
  });

  it('skips compression for HEAD requests', async () => {
    // Prepare
    const headEvent = createTestEvent('/test', 'HEAD');
    app.head('/test', () => {
      return body;
    });

    // Act
    const result = await app.resolve(headEvent, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
    expect(result.isBase64Encoded).toBe(false);
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
      () => {
        return body;
      }
    );

    // Act
    const result = await application.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toEqual('gzip');
    expect(result.isBase64Encoded).toBe(true);
    expect(result.body).toBe(gzipSync(JSON.stringify(body)).toString('base64'));
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
      () => {
        return body;
      }
    );

    // Act
    const result = await application.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
    expect(result.isBase64Encoded).toBe(false);
  });

  it('compresses early return middleware', async () => {
    // Prepare
    const application = new Router();
    const largeMwBody = { test: 'y'.repeat(2000) };

    application.get(
      '/test',
      [
        compress({
          encoding: 'gzip',
        }),
        () => {
          return Promise.resolve(largeMwBody);
        },
      ],
      () => {
        return body;
      }
    );

    // Act
    const result = await application.resolve(event, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(result.isBase64Encoded).toBe(true);
    expect(result.headers).toEqual({
      'content-encoding': 'gzip',
      'content-type': 'application/json',
    });
    expect(
      gunzipSync(Buffer.from(result.body, 'base64')).toString('utf8')
    ).toEqual(JSON.stringify(largeMwBody));
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
      () => {
        return body;
      }
    );

    // Act
    const result = await application.resolve(event, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBe('deflate');
    expect(result.isBase64Encoded).toBe(true);
    expect(result.body).toBe(
      deflateSync(JSON.stringify(body)).toString('base64')
    );
  });

  it('does not compress if Accept-Encoding is set to identity', async () => {
    // Prepare
    const noCompressionEvent = createTestEvent('/test', 'GET', {
      'Accept-Encoding': 'identity',
    });
    app.get('/test', () => {
      return body;
    });

    // Act
    const result = await app.resolve(noCompressionEvent, context);

    // Assess
    expect(result.headers?.['content-encoding']).toBeUndefined();
    expect(result.isBase64Encoded).toBe(false);
  });

  it('skips compression and content-length in streaming mode', async () => {
    // Prepare
    const application = new Router();
    application.use(compress());
    application.get('/test', () => body);

    const handler = streamify(application);
    const responseStream = new ResponseStream();

    // Act
    const result = await handler(event, responseStream, context);

    // Assess
    expect(result.statusCode).toBe(200);
    expect(result.headers['content-encoding']).toBeUndefined();
    expect(result.headers['content-length']).toBeUndefined();
    expect(result.body).toBe(JSON.stringify(body));
    expect(result.body).not.toBe(
      gzipSync(JSON.stringify(body)).toString('base64')
    );
  });
});
