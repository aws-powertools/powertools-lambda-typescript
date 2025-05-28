import { BedrockAgentFunctionResolver } from '@aws-lambda-powertools/event-handler/bedrock-agent';
import type { Context } from 'aws-lambda';

const app = new BedrockAgentFunctionResolver();

app.tool<{ city: string }>(
  async ({ city }) => {
    // Simulate fetching weather data for the city
    return {
      city,
      temperature: '20°C',
      condition: 'Sunny',
    };
  },
  {
    name: 'getWeatherForCity',
    description: 'Get weather for a specific city', // (1)!
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
