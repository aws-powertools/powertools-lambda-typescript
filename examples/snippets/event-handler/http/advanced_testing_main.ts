import type { Context } from 'aws-lambda';
import { expect, test } from 'vitest';
import { handler } from './advanced_cors_simple.js';
import { createTestEvent } from './advanced_testing_helper.js';

test('returns CORS headers', async () => {
  // Preapare
  const event = createTestEvent({
    httpMethod: 'GET',
    headers: {
      Origin: 'https://example.com',
    },
    path: '/todos/123',
  });

  // Act
  const result = await handler(event, {} as Context);

  // Assess
  expect(result.statusCode).toEqual(200);
  expect(result.body).toEqual(JSON.stringify({ todo: { id: '123' } }));
  expect(result.headers?.['access-control-allow-origin']).toEqual(
    'https://example.com'
  );
  expect(
    result.multiValueHeaders?.['access-control-allow-methods'].sort()
  ).toEqual(['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'].sort());
  expect(
    result.multiValueHeaders?.['access-control-allow-headers'].sort()
  ).toEqual(
    [
      'Authorization',
      'Content-Type',
      'X-Amz-Date',
      'X-Amz-Security-Token',
      'X-Api-Key',
    ].sort()
  );
});
