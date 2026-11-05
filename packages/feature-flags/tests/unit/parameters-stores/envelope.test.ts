import { search } from '@aws-lambda-powertools/jmespath';
import { describe, expect, it, vi } from 'vitest';
import { SchemaValidationError } from '../../../src/errors.js';
import { applyEnvelope } from '../../../src/parameters-stores/envelope.js';

vi.mock('@aws-lambda-powertools/jmespath', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('@aws-lambda-powertools/jmespath')>();
  return { ...original, search: vi.fn(original.search) };
});

describe('Flag Document envelope', () => {
  it.each([null, undefined])('rejects an absent selection %j', (selection) => {
    // Prepare
    vi.mocked(search).mockReturnValue(selection);
    const document = { secret: 'secret-document' };
    // Act
    const act = () => applyEnvelope(document, 'settings.flags');
    // Assess
    expect(act).toThrow(
      new SchemaValidationError(
        "Envelope 'settings.flags' did not select a Flag Document"
      )
    );
    expect(act).not.toThrow('secret-document');
    vi.mocked(search).mockReset();
  });

  it('propagates JMESPath syntax errors unchanged', async () => {
    // Prepare
    const error = new Error('invalid expression');
    vi.mocked(search).mockImplementationOnce(() => {
      throw error;
    });
    // Act
    const result = Promise.resolve().then(() => applyEnvelope({}, '['));
    // Assess
    await expect(result).rejects.toBe(error);
  });
});
