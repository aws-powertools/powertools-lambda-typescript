import { z } from 'zod';

/**
 *
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
 * TransferFamilySchema validates events coming from AWS Transfer Family.
 *
 */
const TransferFamilySchema = z.object({
  username: z.string(),
  password: z.string(),
  protocol: z.string(),
  serverId: z.string(),
  sourceIp: z.string().ip(),
});

export { TransferFamilySchema };
