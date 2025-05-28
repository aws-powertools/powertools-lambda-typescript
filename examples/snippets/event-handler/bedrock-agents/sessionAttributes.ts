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

    // your logic to fetch weather data for the city

    return new BedrockFunctionResponse({
      body: JSON.stringify({
        city,
        temperature: '20°C',
        condition: 'Sunny',
      }),
      sessionAttributes: {
        ...sessionAttributes,
        isGoodWeather: true,
      },
      promptSessionAttributes,
      knowledgeBasesConfiguration,
    });
  },
  {
    name: 'getWeatherForCity',
    description: 'Get weather for a specific city',
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
