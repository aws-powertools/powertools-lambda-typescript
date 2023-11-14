import { z } from 'zod';

const VpcLatticeSchema = z.object({
  method: z.string(),
  raw_path: z.string(),
  body: z.string(),
  is_base64_encoded: z.boolean(),
  headers: z.record(z.string(), z.string()),
  query_string_parameters: z.record(z.string(), z.string()),
});

export { VpcLatticeSchema };
