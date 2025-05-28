import {
  BedrockAgentFunctionResolver,
  BedrockFunctionResponse,
} from '@aws-lambda-powertools/event-handler/bedrock-agent';
import type { Context } from 'aws-lambda';

const app = new BedrockAgentFunctionResolver();

app.tool<{ city: string }>(
  async ({ city }, { event }) => {
    try {
      throw new Error('Simulated error for demonstration purposes');
    } catch (error) {
      const {
        sessionAttributes,
        promptSessionAttributes,
        knowledgeBasesConfiguration,
      } = event;
      return new BedrockFunctionResponse({
        body: `An error occurred while fetching the airport code for ${city}`,
        responseState: 'FAILURE',
        sessionAttributes,
        promptSessionAttributes,
        knowledgeBasesConfiguration,
      });
    }
  },
  {
    name: 'getAirportCodeForCity',
    description: 'Get the airport code for a given city',
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
