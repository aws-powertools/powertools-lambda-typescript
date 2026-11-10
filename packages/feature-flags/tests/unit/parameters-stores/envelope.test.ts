import { describe, expect, it, vi } from 'vitest';
import { SchemaValidationError } from '../../../src/errors.js';
import { applyEnvelope } from '../../../src/parameters-stores/envelope.js';

describe('Flag Document envelope', () => {
  it.each([null, undefined])('rejects an absent selection %j', (selection) => {
    // Prepare
    const envelopeSearchFn = vi.fn().mockReturnValue(selection);
    const document = { secret: 'secret-document' };
    // Act
    const act = () =>
      applyEnvelope(document, { envelope: 'settings.flags', envelopeSearchFn });
    // Assess
    expect(act).toThrow(
      new SchemaValidationError(
        "Envelope 'settings.flags' did not select a Flag Document"
      )
    );
    expect(act).not.toThrow('secret-document');
  });

  it('propagates search function errors unchanged', async () => {
    // Prepare
    const error = new Error('invalid expression');
    const envelopeSearchFn = vi.fn().mockImplementationOnce(() => {
      throw error;
    });
    // Act
    const result = Promise.resolve().then(() =>
      applyEnvelope({}, { envelope: '[', envelopeSearchFn })
    );
    // Assess
    await expect(result).rejects.toBe(error);
  });
});
