import {
  AppSyncGraphQLResolver,
  awsDate,
  awsDateTime,
  awsTime,
  awsTimestamp,
  makeId,
} from '@aws-lambda-powertools/event-handler/appsync-graphql';
import type { Context } from 'aws-lambda';

const app = new AppSyncGraphQLResolver();

app.resolver(
  async ({ title, content }) => {
    // your business logic here
    return {
      title,
      content,
      id: makeId(),
      createdAt: awsDateTime(),
      updatedAt: awsDateTime(),
      timestamp: awsTimestamp(),
      time: awsTime(),
      date: awsDate(),
    };
  },
  {
    fieldName: 'createTodo',
    typeName: 'Mutation',
  }
);

export const handler = async (event: unknown, context: Context) =>
  app.resolve(event, context);
