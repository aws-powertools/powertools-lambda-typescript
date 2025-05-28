import { BedrockAgentFunctionResolver } from '@aws-lambda-powertools/event-handler/bedrock-agent';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'WeatherServiceAgent',
  logLevel: 'DEBUG',
});
const app = new BedrockAgentFunctionResolver({ logger });

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
    description: 'Get weather for a specific city',
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
