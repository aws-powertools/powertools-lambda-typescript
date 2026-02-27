import type { APIGatewayProxyResult, Context } from 'aws-lambda';
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
  const result = (await handler(event, {} as Context)) as APIGatewayProxyResult;

  // Assess
  expect(result.statusCode).toEqual(200);
  expect(result.body).toEqual(JSON.stringify({ todo: { id: '123' } }));
  expect(result.headers?.['access-control-allow-origin']).toEqual(
    'https://example.com'
  );
  expect(
    (
      result.multiValueHeaders?.[
        'access-control-allow-methods'
      ] as Array<string>
    ).sort((a, b) => a.localeCompare(b))
  ).toEqual(
    ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'].sort((a, b) =>
      a.localeCompare(b)
    )
  );
  expect(
    (
      result.multiValueHeaders?.[
        'access-control-allow-headers'
      ] as Array<string>
    ).sort((a, b) => a.localeCompare(b))
  ).toEqual(
    [
      'Authorization',
      'Content-Type',
      'X-Amz-Date',
      'X-Amz-Security-Token',
      'X-Api-Key',
    ].sort((a, b) => a.localeCompare(b))
  );
});
