import { describe, expect, it } from 'vitest'; // or jest, depending on the project configuration
import { TransferFamilySchema } from '../../../src/schemas/transfer-family';

describe('TransferFamilySchema', () => {
  it('should validate a valid TransferFamily event', () => {
    const validEvent = {
      username: 'testUser',
      password: 'testPass',
      protocol: 'SFTP',
      serverId: 's-abcd123456',
      sourceIp: '192.168.0.100',
    };

    // This should not throw an error if the event is valid.
    expect(() => TransferFamilySchema.parse(validEvent)).not.toThrow();
  });

  it('should throw an error for an invalid TransferFamily event', () => {
    const invalidEvent = {
      username: 'testUser',
      // missing password
      protocol: 'SFTP',
      serverId: 's-abcd123456',
      sourceIp: 'invalid-ip',
    };

    // This should throw an error due to missing fields / invalid IP.
    expect(() => TransferFamilySchema.parse(invalidEvent)).toThrow();
  });
});
