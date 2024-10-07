import { JSONStringified } from '@aws-lambda-powertools/parser/helpers';
import { APIGatewayProxyEventV2Schema } from '@aws-lambda-powertools/parser/schemas/api-gatewayv2';
import { z } from 'zod';

// biome-ignore format: we need the comment in the next line to stay there to annotate the code snippet in the docs
const extendedSchema = APIGatewayProxyEventV2Schema.extend({ // (1)!
  body: JSONStringified(
    z.object({
      name: z.string(),
      age: z.number(),
    })
  ),
});
type ExtendedAPIGatewayEvent = z.infer<typeof extendedSchema>;
