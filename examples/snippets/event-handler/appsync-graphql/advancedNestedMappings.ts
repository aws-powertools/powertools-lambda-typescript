import { AppSyncGraphQLResolver } from '@aws-lambda-powertools/event-handler/appsync-graphql';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger({
  serviceName: 'TodoManager',
});
const app = new AppSyncGraphQLResolver({ logger });

type Location = {
  id: string;
  name: string;
  description?: string;
};

const locationsResolver = async (): Promise<Location[]> => {
  logger.debug('Resolving locations');
  // Simulate fetching locations from a database or external service
  return [
    {
      id: 'loc1',
      name: 'Location One',
      description: 'First location description',
    },
    {
      id: 'loc2',
      name: 'Location Two',
      description: 'Second location description',
    },
  ];
};

app.resolver(locationsResolver, {
  fieldName: 'locations',
  typeName: 'Merchant',
});
app.resolver(locationsResolver, {
  fieldName: 'listLocations', // (1)!
});

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
