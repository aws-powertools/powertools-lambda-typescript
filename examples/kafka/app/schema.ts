import { z } from 'zod';

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().positive({
    message: "Price can't be negative",
  }),
});
