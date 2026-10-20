import { z } from 'zod';
import type { TransferFamilyEvent } from '../types/schema.js';

/**
 * Zod schema for AWS Transfer Family events.
 *
 * @example
 * ```json
 * {
 *   "username": "testUser",
 *   "password": "testPass",
 *   "protocol": "SFTP",
 *   "serverId": "s-abcd123456",
 *   "sourceIp": "192.168.0.100"
 * }
 * ```
 *
 * @see {@link TransferFamilyEvent | `TransferFamilyEvent`}
 * @see {@link https://docs.aws.amazon.com/transfer/latest/userguide/custom-lambda-idp.html}
 */
const TransferFamilySchema = z.object({
  username: z.string(),
  password: z.string(),
  protocol: z.string(),
  serverId: z.string(),
  sourceIp: z.ipv4(),
});

export { TransferFamilySchema };
