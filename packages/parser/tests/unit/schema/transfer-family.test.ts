import { describe, expect, it } from 'vitest';
import { TransferFamilySchema } from '../../../src/schemas/transfer-family';
import type { TransferFamilyEvent } from '../../../src/types/schema.js';
import { getTestEvent } from '../helpers/utils';

describe('Schema: TransferFamily', () => {
  const baseEvent = getTestEvent<TransferFamilyEvent>({
    eventsPath: 'transfer-family',
    filename: 'base',
  });

  it('parses a valid TransferFamily event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = TransferFamilySchema.parse(event);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('throws if the event is not a valid TransferFamily event', () => {
    // Prepare
    const invalidEvent = {
      username: 'testUser',
      protocol: 'SFTP',
      serverId: 's-abcd123456',
      sourceIp: 'invalid-ip',
    };

    // Act & Assess
    expect(() => TransferFamilySchema.parse(invalidEvent)).toThrow();
  });
});
