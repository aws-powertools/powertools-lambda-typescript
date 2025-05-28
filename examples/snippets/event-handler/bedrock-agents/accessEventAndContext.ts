import { BedrockAgentFunctionResolver } from '@aws-lambda-powertools/event-handler/bedrock-agent';
import type { Context } from 'aws-lambda';

const app = new BedrockAgentFunctionResolver();

app.tool<{ city: string }>(
  async ({ city }, { event, context }) => {
    const { sessionAttributes } = event;
    sessionAttributes.requestId = context.awsRequestId;

    return {
      city,
      temperature: '20°C',
      condition: 'Sunny',
    };
  },
  {
    name: 'getWeatherForCity',
    description: 'Get weather for a specific city',
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
