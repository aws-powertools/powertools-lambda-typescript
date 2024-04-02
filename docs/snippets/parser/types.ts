import { Context } from 'aws-lambda';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { z } from 'zod';
import middy from '@middy/core';

const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string(),
  items: z.array(
    z.object({
      id: z.number().positive(),
      quantity: z.number(),
      description: z.string(),
    })
  ),
  optionalField: z.string().optional(),
});

type Order = z.infer<typeof orderSchema>; // (1)!

const lambdaHandler = async (
  event: Order, // (2)!
  _context: Context
): Promise<void> => {
  for (const item of event.items) {
    // item is parsed as OrderItem
    console.log(item.id); // (3)!
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: orderSchema })
);
