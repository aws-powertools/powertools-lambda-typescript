import { describe, expect, it, vi } from 'vitest';
import { deserialize } from '../../src/deserializer/json.js';

describe('JSON Deserializer: ', () => {
  it('returns invalid JSON as plain text without logging the payload', () => {
    // Prepare
    const plainText = 'sensitive-user-data';
    const data = Buffer.from(plainText).toString('base64');
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    // Act
    const result = deserialize(data);

    // Assess
    expect(result).toBe(plainText);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
