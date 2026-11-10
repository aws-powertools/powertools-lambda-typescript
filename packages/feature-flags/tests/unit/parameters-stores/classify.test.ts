import {
  AppConfigAgentError,
  GetParameterError,
  ParameterNotFoundError,
  TransformParameterError,
} from '@aws-lambda-powertools/parameters/errors';
import { describe, expect, it } from 'vitest';
import { isAvailabilityFailure } from '../../../src/parameters-stores/classify.js';

/** Wraps a structured SDK or fetch cause in a Parameters retrieval error. */
const retrievalError = (cause: unknown) =>
  new GetParameterError('retrieval failed', { cause });

describe('Parameters availability classification', () => {
  it.each([
    {
      rule: 'Agent 500',
      error: new AppConfigAgentError('', 500),
      expected: true,
    },
    {
      rule: 'Agent 503',
      error: new AppConfigAgentError('', 503),
      expected: true,
    },
    {
      rule: 'Agent 429',
      error: new AppConfigAgentError('', 429),
      expected: true,
    },
    {
      rule: 'Agent 400',
      error: new AppConfigAgentError('', 400),
      expected: false,
    },
    {
      rule: 'Agent 401',
      error: new AppConfigAgentError('', 401),
      expected: false,
    },
    {
      rule: 'Agent 403',
      error: new AppConfigAgentError('', 403),
      expected: false,
    },
    {
      rule: 'Agent 404',
      error: new AppConfigAgentError('', 404),
      expected: false,
    },
    {
      rule: 'Agent 418',
      error: new AppConfigAgentError('', 418),
      expected: false,
    },
    {
      rule: 'Agent 499 boundary',
      error: new AppConfigAgentError('', 499),
      expected: false,
    },
    {
      rule: 'Agent 200',
      error: new AppConfigAgentError('', 200),
      expected: false,
    },
    {
      rule: 'Agent 403 with outage cause',
      error: new AppConfigAgentError('', 403, {
        cause: new TypeError('fetch failed'),
      }),
      expected: false,
    },
    {
      rule: 'missing Agent path or SDK parameter',
      error: new ParameterNotFoundError(),
      expected: false,
    },
    {
      rule: 'missing parameter with outage cause',
      error: new ParameterNotFoundError('', {
        cause: new TypeError('fetch failed'),
      }),
      expected: false,
    },
    {
      rule: 'Agent or SDK missing application cause',
      error: new GetParameterError(),
      expected: false,
    },
    {
      rule: 'Agent or SDK malformed JSON',
      error: new TransformParameterError('json', ''),
      expected: false,
    },
    {
      rule: 'Agent fetch TypeError',
      error: retrievalError(new TypeError('not a network message')),
      expected: true,
    },
    {
      rule: 'Agent timeout Error',
      error: retrievalError(
        Object.assign(new Error('request timed out'), { name: 'TimeoutError' })
      ),
      expected: true,
    },
    {
      rule: 'Agent abort Error',
      error: retrievalError(
        Object.assign(new Error('request aborted'), { name: 'AbortError' })
      ),
      expected: true,
    },
    {
      rule: 'Agent timeout DOMException',
      error: retrievalError(new DOMException('', 'TimeoutError')),
      expected: true,
    },
    {
      rule: 'SDK throttling',
      error: retrievalError({ name: 'ThrottlingException' }),
      expected: true,
    },
    {
      rule: 'SDK too many requests',
      error: retrievalError({ name: 'TooManyRequestsException' }),
      expected: true,
    },
    {
      rule: 'SDK internal server',
      error: retrievalError({ name: 'InternalServerException' }),
      expected: true,
    },
    {
      rule: 'SDK service unavailable',
      error: retrievalError({ name: 'ServiceUnavailableException' }),
      expected: true,
    },
    {
      rule: 'SDK timeout',
      error: retrievalError({ name: 'TimeoutError' }),
      expected: true,
    },
    {
      rule: 'SDK abort',
      error: retrievalError({ name: 'AbortError' }),
      expected: true,
    },
    {
      rule: 'SDK 500 metadata',
      error: retrievalError({ $metadata: { httpStatusCode: 500 } }),
      expected: true,
    },
    {
      rule: 'SDK 503 metadata',
      error: retrievalError({ $metadata: { httpStatusCode: 503 } }),
      expected: true,
    },
    {
      rule: 'SDK 429 metadata',
      error: retrievalError({ $metadata: { httpStatusCode: 429 } }),
      expected: true,
    },
    {
      rule: 'SDK native Error with 500 metadata',
      error: retrievalError(
        Object.assign(new Error('retrieval failed'), {
          $metadata: { httpStatusCode: 500 },
        })
      ),
      expected: true,
    },
    {
      rule: 'SDK connection reset',
      error: retrievalError({ code: 'ECONNRESET' }),
      expected: true,
    },
    {
      rule: 'SDK connection refused',
      error: retrievalError({ code: 'ECONNREFUSED' }),
      expected: true,
    },
    {
      rule: 'SDK connection timeout',
      error: retrievalError({ code: 'ETIMEDOUT' }),
      expected: true,
    },
    {
      rule: 'SDK host not found',
      error: retrievalError({ code: 'ENOTFOUND' }),
      expected: true,
    },
    {
      rule: 'SDK DNS retry',
      error: retrievalError({ code: 'EAI_AGAIN' }),
      expected: true,
    },
    {
      rule: 'SDK native network Error',
      error: retrievalError(
        Object.assign(new Error('connection reset'), { code: 'ECONNRESET' })
      ),
      expected: true,
    },
    {
      rule: 'SDK AccessDenied 403',
      error: retrievalError({
        name: 'AccessDeniedException',
        $metadata: { httpStatusCode: 403 },
      }),
      expected: false,
    },
    {
      rule: 'SDK ResourceNotFound 404',
      error: retrievalError({
        name: 'ResourceNotFoundException',
        $metadata: { httpStatusCode: 404 },
      }),
      expected: false,
    },
    {
      rule: 'SDK BadRequest 400',
      error: retrievalError({
        name: 'BadRequestException',
        $metadata: { httpStatusCode: 400 },
      }),
      expected: false,
    },
    {
      rule: 'SDK 401 metadata',
      error: retrievalError({ $metadata: { httpStatusCode: 401 } }),
      expected: false,
    },
    {
      rule: 'SDK 418 metadata',
      error: retrievalError({ $metadata: { httpStatusCode: 418 } }),
      expected: false,
    },
    {
      rule: 'SDK 499 boundary',
      error: retrievalError({ $metadata: { httpStatusCode: 499 } }),
      expected: false,
    },
    {
      rule: 'SDK successful status',
      error: retrievalError({ $metadata: { httpStatusCode: 200 } }),
      expected: false,
    },
    {
      rule: 'SDK unknown error name',
      error: retrievalError({ name: 'UnknownException' }),
      expected: false,
    },
    {
      rule: 'SDK unknown network code',
      error: retrievalError({ code: 'EINVAL' }),
      expected: false,
    },
    {
      rule: 'SDK absent status',
      error: retrievalError({ $metadata: {} }),
      expected: false,
    },
    {
      rule: 'SDK string status',
      error: retrievalError({ $metadata: { httpStatusCode: '500' } }),
      expected: false,
    },
    {
      rule: 'SDK null metadata',
      error: retrievalError({ $metadata: null }),
      expected: false,
    },
    {
      rule: 'SDK absent cause',
      error: retrievalError(undefined),
      expected: false,
    },
    { rule: 'SDK null cause', error: retrievalError(null), expected: false },
    {
      rule: 'SDK string cause',
      error: retrievalError('ThrottlingException'),
      expected: false,
    },
    {
      rule: 'SDK unknown Error cause',
      error: retrievalError(new Error('ThrottlingException')),
      expected: false,
    },
    {
      rule: 'unwrapped availability Error',
      error: Object.assign(new Error('request timed out'), {
        name: 'TimeoutError',
      }),
      expected: false,
    },
    {
      rule: 'unrelated error',
      error: new Error('fetch failed'),
      expected: false,
    },
    {
      rule: 'unrelated record',
      error: { statusCode: 500, name: 'AppConfigAgentError' },
      expected: false,
    },
    { rule: 'unknown thrown value', error: undefined, expected: false },
  ])('classifies $rule as $expected', ({ error, expected }) => {
    // Prepare
    const input = error;
    // Act
    const result = isAvailabilityFailure(input);
    // Assess
    expect(result).toBe(expected);
  });

  it('never reads the error or cause message', () => {
    // Prepare
    const cause = Object.assign(new Error('request timed out'), {
      name: 'TimeoutError',
    });
    const error = retrievalError(cause);
    for (const value of [error, cause]) {
      Object.defineProperty(value, 'message', {
        enumerable: true,
        get: () => {
          throw new Error('Do not read messages');
        },
      });
    }
    // Act
    const result = isAvailabilityFailure(error);
    // Assess
    expect(result).toBe(true);
  });
});
