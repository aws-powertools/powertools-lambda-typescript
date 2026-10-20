import {
  BedrockAgentFunctionResolver,
  BedrockFunctionResponse,
} from '@aws-lambda-powertools/event-handler/bedrock-agent';
import type { Context } from 'aws-lambda';

const app = new BedrockAgentFunctionResolver();

app.tool<{ city: string }>(
  async ({ city }, { event }) => {
    const {
      sessionAttributes,
      promptSessionAttributes,
      knowledgeBasesConfiguration,
    } = event;

    // your logic to fetch airport code for the city

    return new BedrockFunctionResponse({
      body: JSON.stringify({
        city,
        airportCode: 'XYZ',
      }),
      sessionAttributes: {
        ...sessionAttributes,
        isCommercialAirport: true,
      },
      promptSessionAttributes,
      knowledgeBasesConfiguration,
    });
  },
  {
    name: 'getAirportCodeForCity',
    description: 'Get the airport code for a given city',
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
