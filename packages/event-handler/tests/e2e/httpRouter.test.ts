import { join } from 'node:path';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RestApiTestFunction } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  STACK_OUTPUT_API_URL,
  STACK_OUTPUT_FUNCTION_NAME,
} from './constants.js';

const lambdaFunctionCodeFilePath = join(
  __dirname,
  'httpRouter.test.FunctionCode.ts'
);

/**
 * End-to-end tests for REST event handler
 *
 * These tests deploy actual AWS infrastructure (API Gateway + Lambda)
 * and verify the behavior by making HTTP requests to the deployed endpoint.
 */
describe('REST Event Handler E2E tests', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'HttpRouter',
    },
  });

  let apiUrl: string;
  let functionName: string;

  beforeAll(async () => {
    // Prepare
    new RestApiTestFunction(
      testStack,
      { entry: lambdaFunctionCodeFilePath },
      { nameSuffix: STACK_OUTPUT_FUNCTION_NAME }
    );

    // Act
    await testStack.deploy();

    // Assess
    apiUrl = testStack.findAndGetStackOutputValue(STACK_OUTPUT_API_URL);
    functionName = testStack.findAndGetStackOutputValue(
      STACK_OUTPUT_FUNCTION_NAME
    );

    console.log(`Deployed API URL: ${apiUrl}`);
    console.log(`Function name: ${functionName}`);
  }, 900_000);

  describe('HTTP Methods', () => {
    it('handles GET requests', async () => {
      // Act
      // Prepare
      const response = await fetch(`${apiUrl}/methods`);
      const data = await response.json();

      // Assess

      // Assess
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      expect(data.method).toBe('GET');
    });

    it('handles POST requests', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/methods`, {
        method: 'POST',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.method).toBe('POST');
    });

    it('handles PUT requests', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/methods`, {
        method: 'PUT',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.method).toBe('PUT');
    });

    it('handles PATCH requests', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/methods`, {
        method: 'PATCH',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.method).toBe('PATCH');
    });

    it('handles DELETE requests', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/methods`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.method).toBe('DELETE');
    });

    it('handles HEAD requests', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/methods`, {
        method: 'HEAD',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      // Per HTTP spec, HEAD must not have a response body
      const text = await response.text();
      expect(text).toBe('');
    });

    it('handles OPTIONS requests', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/methods`, {
        method: 'OPTIONS',
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.method).toBe('OPTIONS');
    });
  });

  describe('Path Parameters', () => {
    it('extracts single path parameter', async () => {
      // Prepare
      const userId = '789';

      // Act
      const response = await fetch(`${apiUrl}/params/users/${userId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      expect(data.userId).toBe(userId);
    });

    it('extracts multiple path parameters', async () => {
      // Prepare
      const userId = '123';
      const postId = '456';

      // Act
      const response = await fetch(
        `${apiUrl}/params/users/${userId}/posts/${postId}`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.userId).toBe(userId);
      expect(data.postId).toBe(postId);
    });

    it('handles URL-encoded path segments', async () => {
      // Prepare
      const userId = 'John Doe';
      const encodedUserId = encodeURIComponent(userId);

      // Act
      const response = await fetch(`${apiUrl}/params/users/${encodedUserId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.userId).toBe(userId);
    });

    it('handles special characters in path parameters', async () => {
      // Prepare
      const userId = 'user@example.com';
      const encodedUserId = encodeURIComponent(userId);

      // Act
      const response = await fetch(`${apiUrl}/params/users/${encodedUserId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.userId).toBe(userId);
    });
  });

  describe('Query String Parameters', () => {
    it('handles single query parameter', async () => {
      // Prepare
      const searchQuery = 'test-query';

      // Act
      const response = await fetch(`${apiUrl}/params/search?q=${searchQuery}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query).toBe(searchQuery);
    });

    it('handles multiple query parameters', async () => {
      // Prepare
      const searchQuery = 'test';
      const limit = '10';

      // Act
      const response = await fetch(
        `${apiUrl}/params/search?q=${searchQuery}&limit=${limit}`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query).toBe(searchQuery);
      expect(data.limit).toBe(limit);
    });

    it('handles array query parameters', async () => {
      // Prepare
      const searchQuery = 'test';
      const filters = ['active', 'published'];

      // Act
      const response = await fetch(
        `${apiUrl}/params/search?q=${searchQuery}&filter=${filters[0]}&filter=${filters[1]}`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query).toBe(searchQuery);
      expect(data.filters).toEqual(['active', 'published']);
    });

    it('handles missing query parameters', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/params/search`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query).toBeNull();
      expect(data.limit).toBeNull();
      expect(data.filters).toBeUndefined();
    });

    it('handles URL-encoded query parameter values', async () => {
      // Prepare
      const searchQuery = 'hello world';
      const encodedQuery = encodeURIComponent(searchQuery);

      // Act
      const response = await fetch(`${apiUrl}/params/search?q=${encodedQuery}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query).toBe(searchQuery);
    });

    it('handles special characters in query parameters', async () => {
      // Prepare
      const searchQuery = 'test@example.com';
      const encodedQuery = encodeURIComponent(searchQuery);

      // Act
      const response = await fetch(`${apiUrl}/params/search?q=${encodedQuery}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query).toBe(searchQuery);
    });

    it('handles empty string query parameters', async () => {
      // Prepare
      const limit = '10';

      // Act
      const response = await fetch(`${apiUrl}/params/search?q=&limit=${limit}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query).toBe('');
      expect(data.limit).toBe(limit);
    });

    it('handles single-value array parameter', async () => {
      // Act
      const response = await fetch(`${apiUrl}/params/search?filter=active`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.filters).toEqual(['active']);
    });
  });

  describe('Error Handling', () => {
    it('returns 400 for bad request errors', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/errors/400`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      expect(data.error).toBe('Bad Request');
      expect(data.message).toBe('Invalid request');
      expect(data.custom).toBe(true);
    });

    it('returns 401 for unauthorized errors', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/errors/401`);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.statusCode).toBe(401);
      expect(data.error).toBe('UnauthorizedError');
      expect(data.message).toBe('Not authenticated');
    });

    it('returns 403 for forbidden errors', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/errors/403`);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.statusCode).toBe(403);
      expect(data.error).toBe('ForbiddenError');
      expect(data.message).toBe('Access denied');
    });

    it('returns 404 for not found errors', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/errors/404`);
      const data = await response.json();

      // Route exists and throws NotFoundError, which is caught by custom notFound handler
      expect(response.status).toBe(404);
      expect(data.statusCode).toBe(404);
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('Custom not found handler');
    });

    it('returns 405 for method not allowed errors', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/errors/405`);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.statusCode).toBe(405);
      expect(data.error).toBe('MethodNotAllowedError');
      expect(data.message).toBe('Method not allowed');
    });

    it('returns 500 for internal server errors', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/errors/500`);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.statusCode).toBe(500);
      expect(data.error).toBe('InternalServerError');
      expect(data.message).toBe('Server error');
    });

    it('returns 500 for generic errors', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/errors/generic`);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.statusCode).toBe(500);
      expect(data.error).toBe('Internal Server Error');
      expect(data.message).toBeDefined();
    });

    it('applies custom error handler for specific error type', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/errors/custom`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bad Request');
      expect(data.custom).toBe(true);
      expect(data.message).toContain('custom handler');
    });

    it('applies custom not found handler for unmatched routes', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/errors/nonexistent-route`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not Found');
      expect(data.message).toBe('Custom not found handler');
    });
  });

  describe('Nested Router', () => {
    it('handles GET request to nested router', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/nested/info`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.nested).toBe(true);
      expect(data.path).toBe('/nested/info');
    });

    it('handles POST request to nested router', async () => {
      // Prepare
      const testData = { name: 'test', value: 123 };

      // Act
      const response = await fetch(`${apiUrl}/nested/create`, {
        method: 'POST',
        body: JSON.stringify(testData),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.nested).toBe(true);
      expect(data.created).toEqual(testData);
    });
  });

  describe('CORS Middleware', () => {
    it('returns CORS headers for GET request', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/cors/data`, {
        headers: {
          Origin: 'https://example.com',
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      expect(data.message).toBe('CORS enabled response');
      expect(response.headers.get('access-control-allow-origin')).toBe(
        'https://example.com'
      );
      expect(response.headers.get('access-control-allow-credentials')).toBe(
        'true'
      );
    });

    it('returns CORS headers for POST request', async () => {
      // Prepare
      const testData = { test: 'data' };

      // Act
      const response = await fetch(`${apiUrl}/cors/data`, {
        method: 'POST',
        body: JSON.stringify(testData),
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://example.com',
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toEqual(testData);
      expect(response.headers.get('access-control-allow-origin')).toBe(
        'https://example.com'
      );
    });

    it('handles OPTIONS preflight request', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/cors/data`, {
        method: 'OPTIONS',
        headers: {
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type',
          Origin: 'https://example.com',
        },
      });

      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBe(
        'https://example.com'
      );

      const allowedMethods = response.headers.get(
        'access-control-allow-methods'
      );
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');

      expect(response.headers.get('access-control-allow-headers')).toContain(
        'content-type'
      );
      expect(response.headers.get('access-control-max-age')).toBe('300');
      expect(response.headers.get('vary')).toBe('Origin');
    });
  });

  describe('Compression Middleware', () => {
    it('compresses large responses', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/compress/large`, {
        headers: { 'Accept-Encoding': 'gzip' },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('compressed');
      expect(data.data.length).toBe(200);
      expect(response.headers.get('content-encoding')).toBe('gzip');
    });
  });

  describe('Request Body and Headers', () => {
    it('processes request body and headers correctly', async () => {
      // Prepare
      const testData = { test: 'data', value: 123 };
      const customHeaderValue = 'header-value';

      // Act
      const response = await fetch(`${apiUrl}/echo`, {
        method: 'POST',
        body: JSON.stringify(testData),
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': customHeaderValue,
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.body).toEqual(testData);
      expect(data.headers['x-custom-header']).toBe(customHeaderValue);
      expect(data.headers['content-type']).toBe('application/json');
    });

    it('handles multi-value headers', async () => {
      // Prepare
      const testData = { test: 'data' };

      // Act
      const response = await fetch(`${apiUrl}/echo`, {
        method: 'POST',
        body: JSON.stringify(testData),
        headers: {
          'Content-Type': 'application/json',
          'X-Multi-Header': 'value1, value2',
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.headers['x-multi-header']).toBeDefined();
      expect(data.headers['x-multi-header']).toContain('value1');
      expect(data.headers['x-multi-header']).toContain('value2');
    });

    it('handles application/x-www-form-urlencoded content type', async () => {
      // Prepare
      const formData = new URLSearchParams({
        username: 'testuser',
        email: 'test@example.com',
      });

      // Act
      const response = await fetch(`${apiUrl}/form`, {
        method: 'POST',
        body: formData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contentType).toBe('application/x-www-form-urlencoded');
      expect(data.received).toBe(true);
      expect(data.bodyLength).toBeGreaterThan(0);
    });

    it('handles multipart/form-data content type', async () => {
      // Prepare
      const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
      const formBody = [
        `------${boundary}`,
        'Content-Disposition: form-data; name="field1"',
        '',
        'value1',
        `------${boundary}`,
        'Content-Disposition: form-data; name="field2"',
        '',
        'value2',
        `------${boundary}--`,
      ].join('\r\n');

      // Act
      const response = await fetch(`${apiUrl}/form`, {
        method: 'POST',
        body: formBody,
        headers: {
          'Content-Type': `multipart/form-data; boundary=----${boundary}`,
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contentType).toContain('multipart/form-data');
      expect(data.received).toBe(true);
      expect(data.bodyLength).toBeGreaterThan(0);
    });

    it('returns 500 when handler fails to parse invalid JSON', async () => {
      // Prepare
      const invalidJson = '{invalid json}';

      // Act
      const response = await fetch(`${apiUrl}/echo`, {
        method: 'POST',
        body: invalidJson,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(500);
    });
  });

  describe('Multi-Value Headers', () => {
    it('returns multiple Set-Cookie headers', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/multi-headers/set-cookies`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Multiple cookies set');
      expect(response.headers.has('set-cookie')).toBe(true);
    });
  });

  describe('Binary Content', () => {
    it('handles base64-encoded binary upload', async () => {
      // Prepare
      const binaryData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const base64Data = Buffer.from(binaryData).toString('base64');

      // Act
      const response = await fetch(`${apiUrl}/binary/upload`, {
        method: 'POST',
        body: base64Data,
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.contentType).toBe('application/octet-stream');
      expect(data.bodyLength).toBeGreaterThan(0);
    });

    it('handles image upload with binary content', async () => {
      // Prepare
      const imageData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52,
      ]);

      // Act
      const response = await fetch(`${apiUrl}/binary/image`, {
        method: 'POST',
        body: imageData,
        headers: {
          'Content-Type': 'image/png',
        },
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.contentType).toBe('image/png');
    });

    it('returns base64-encoded binary content', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/binary/download`);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/png');
      expect(text).toBeDefined();
      expect(text.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Response', () => {
    it('returns custom status code and headers', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/custom-response`);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
      expect(data.message).toBe('Custom response');
      expect(response.headers.get('x-custom-header')).toBe('custom-value');
      expect(response.headers.get('cache-control')).toBe('max-age=3600');
    });
  });

  describe('Path Normalization', () => {
    it('handles root path GET request', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Root path');
      expect(data.version).toBe('1.0.0');
    });

    it('returns 404 for path with trailing slash when route has no trailing slash', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/methods/`);

      expect(response.status).toBe(404);
    });

    it('handles path without trailing slash', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/methods`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.method).toBe('GET');
    });

    it('handles path with query string', async () => {
      // Prepare
      const searchQuery = 'normalize-test';

      // Act
      const response = await fetch(`${apiUrl}/params/search?q=${searchQuery}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.query).toBe(searchQuery);
    });

    it('handles path with fragment in URL', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}/methods#fragment`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.method).toBe('GET');
    });

    it('treats path with leading double slash as protocol-relative URL', async () => {
      // Prepare
      const response = await fetch(`${apiUrl}//methods`);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Double slash at the beginning is treated as protocol-relative URL by the URL constructor
      // in converters.ts, which results in hitting root path instead
      expect(data.message).toBe('Root path');
      expect(data.version).toBe('1.0.0');
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, 900_000);
});
