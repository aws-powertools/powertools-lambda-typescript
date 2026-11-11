import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import {
  AppConfigAgentError,
  GetParameterError,
  ParameterNotFoundError,
  TransformParameterError,
} from '@aws-lambda-powertools/parameters/errors';
import { describe, expect, it, vi } from 'vitest';
import {
  SchemaValidationError,
  StoreUnavailableError,
} from '../../../src/errors.js';
import { createDocumentSource } from '../../../src/parameters-stores/createDocumentSource.js';

describe('createDocumentSource', () => {
  it('returns the retrieved document unchanged', async () => {
    // Prepare
    const document = { checkout: { default: true } };
    const retrieve = vi
      .fn<() => Promise<JSONValue>>()
      .mockResolvedValue(document);
    const source = createDocumentSource({ storeName: 'appconfig', retrieve });
    // Act
    const result = await source();
    // Assess
    expect(result).toBe(document);
    expect(retrieve).toHaveBeenCalledExactlyOnceWith();
  });

  it('retrieves a document for every source call', async () => {
    // Prepare
    const firstDocument = { checkout: { default: true } };
    const secondDocument = { checkout: { default: false } };
    const retrieve = vi
      .fn<() => Promise<JSONValue>>()
      .mockResolvedValueOnce(firstDocument)
      .mockResolvedValueOnce(secondDocument);
    const source = createDocumentSource({ storeName: 'appconfig', retrieve });
    // Act
    const first = await source();
    const second = await source();
    // Assess
    expect(first).toBe(firstDocument);
    expect(second).toBe(secondDocument);
    expect(retrieve).toHaveBeenCalledTimes(2);
  });

  it('selects an embedded Flag Document', async () => {
    // Prepare
    const document = { settings: { flags: { checkout: { default: true } } } };
    const envelopeSearchFn = vi.fn().mockReturnValue(document.settings.flags);
    const source = createDocumentSource({
      storeName: 'appconfig',
      retrieve: async () => document,
      envelope: 'settings.flags',
      envelopeSearchFn,
    });
    // Act
    const result = await source();
    // Assess
    expect(result).toBe(document.settings.flags);
    expect(envelopeSearchFn).toHaveBeenCalledExactlyOnceWith(
      'settings.flags',
      document
    );
  });

  it('rejects an envelope miss without using the whole document', async () => {
    // Prepare
    const source = createDocumentSource({
      storeName: 'appconfig',
      retrieve: async () => ({
        checkout: { default: true },
        secret: 'secret-document',
      }),
      envelope: 'settings.flags',
      envelopeSearchFn: () => undefined,
    });
    // Act
    const result = source();
    // Assess
    await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
    await expect(result).rejects.toThrow(
      "Envelope 'settings.flags' did not select a Flag Document"
    );
    await expect(result).rejects.not.toThrow('secret-document');
  });

  it.each([
    {
      storeName: 'appconfig',
      error: new GetParameterError('retrieval failed', {
        cause: Object.assign(new Error('retrieval failed'), {
          name: 'ThrottlingException',
        }),
      }),
    },
    {
      storeName: 'appconfig-agent',
      error: new AppConfigAgentError('opaque failure', 503),
    },
  ])(
    'preserves the availability cause and message for $storeName',
    async ({ storeName, error }) => {
      // Prepare
      const source = createDocumentSource({
        storeName,
        retrieve: vi.fn<() => Promise<JSONValue>>().mockRejectedValue(error),
      });
      // Act
      const result = source();
      // Assess
      await expect(result).rejects.toBeInstanceOf(StoreUnavailableError);
      await expect(result).rejects.toHaveProperty(
        'message',
        `${storeName} is unavailable`
      );
      await expect(result).rejects.toSatisfy(
        (failure: unknown) =>
          failure instanceof StoreUnavailableError && failure.cause === error
      );
    }
  );

  it.each([
    new GetParameterError('denied', {
      cause: Object.assign(new Error('access denied'), {
        name: 'AccessDeniedException',
        $metadata: { httpStatusCode: 403 },
      }),
    }),
    new AppConfigAgentError('denied', 403),
    new ParameterNotFoundError('missing profile'),
    new TransformParameterError('json', 'malformed document'),
    new GetParameterError('missing application'),
    new Error('unexpected failure'),
  ])('rethrows other retrieval errors unchanged for %s', async (error) => {
    // Prepare
    const source = createDocumentSource({
      storeName: 'appconfig',
      retrieve: vi.fn<() => Promise<JSONValue>>().mockRejectedValue(error),
    });
    // Act
    const result = source();
    // Assess
    await expect(result).rejects.toBe(error);
  });
});
