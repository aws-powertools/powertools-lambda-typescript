import { z } from 'zod';

const orderItemSchema = z.object({
  id: z.number().positive(),
  quantity: z.number(),
  description: z.string(),
});

export const orderSchema = z
  .object({
    id: z.number().positive(),
    description: z.string(),
    items: z.array(orderItemSchema).refine((items) => items.length > 0, {
      message: 'Order must have at least one item', // (1)!
    }),
    optionalField: z.string().optional(),
  })
  .refine((order) => order.id > 100 && order.items.length > 100, {
    message:
      'All orders with more than 100 items must have an id greater than 100', // (2)!
  });
