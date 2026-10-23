import { z } from 'zod';

export const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string().transform((value, ctx) => {
    try {
      return decodeURIComponent(value); // (1)!
    } catch {
      ctx.issues.push({
        code: 'custom',
        message: 'Description is not valid URI-encoded text',
        input: value,
      }); // (2)!
      return z.NEVER; // (3)!
    }
  }),
});
