import { BedrockAgentFunctionResolver } from '@aws-lambda-powertools/event-handler/bedrock-agent';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'serverlessAirline',
  logLevel: 'DEBUG',
});
const app = new BedrockAgentFunctionResolver({ logger });

app.tool<{ city: string }>(
  async ({ city }) => {
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
