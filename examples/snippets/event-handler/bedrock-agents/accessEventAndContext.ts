import { BedrockAgentFunctionResolver } from '@aws-lambda-powertools/event-handler/bedrock-agent';
import type { Context } from 'aws-lambda';

const app = new BedrockAgentFunctionResolver();

app.tool<{ city: string }>(
  async ({ city }, { event, context }) => {
    const { sessionAttributes } = event;
    sessionAttributes.requestId = context.awsRequestId;

    return {
      city,
      airportCode: 'XYZ', // Simulated airport code for the city
    };
  },
  {
    name: 'getAirportCodeForCity',
    description: 'Get the airport code for a given city',
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
