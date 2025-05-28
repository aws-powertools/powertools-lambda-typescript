import { BedrockAgentFunctionResolver } from '@aws-lambda-powertools/event-handler/bedrock-agent';
import type { Context } from 'aws-lambda';

const app = new BedrockAgentFunctionResolver();

app.tool<{ city: string }>(
  async ({ city }) => {
    return {
      city,
      airportCode: 'XYZ',
    };
  },
  {
    name: 'getAirportCodeForCity',
    description: 'Get the airport code for a given city', // (1)!
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
