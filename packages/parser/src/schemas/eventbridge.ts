import { z } from 'zod';

const EventBridgeSchema = z.object({
  version: z.string(),
  id: z.string(),
  source: z.string(),
  account: z.string(),
  time: z.string().datetime(),
  region: z.string(),
  resources: z.array(z.string()),
  detail_type: z.string().optional(),
  detail: z.object({}).optional(),
  replay_name: z.string().optional(),
});

export { EventBridgeSchema };
