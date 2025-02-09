import { z } from 'zod';

/**
 * TransferFamilySchema validates events coming from AWS Transfer Family.
 */
export const TransferFamilySchema = z.object({
  username: z.string(),
  password: z.string(),
  protocol: z.string(),
  serverId: z.string(),
  // Validates that sourceIp is a valid IPv4/IPv6 string. Adjust as needed.
  sourceIp: z
    .string()
    .refine(
      (ip) =>
        /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) ||
        !!ip.match(/^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i),
      { message: 'Invalid IP address' }
    ),
});

/**
 * Type alias for TransferFamilyEvent, inferred from this schema.
 */
export type TransferFamilyEvent = z.infer<typeof TransferFamilySchema>;
