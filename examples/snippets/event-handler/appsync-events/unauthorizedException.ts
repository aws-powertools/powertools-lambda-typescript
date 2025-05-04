import {
  AppSyncEventsResolver,
  UnauthorizedException,
} from '@aws-lambda-powertools/event-handler/appsync-events';
import type { Context } from 'aws-lambda';

const app = new AppSyncEventsResolver();

app.onPublish('/default/foo', (payload) => {
  return payload;
});

app.onPublish('/*', () => {
  throw new UnauthorizedException('You can only publish to /default/foo');
});

app.onSubscribe('/default/foo', () => true);

app.onSubscribe('/*', () => {
  throw new UnauthorizedException('You can only subscribe to /default/foo');
});

export const handler = async (event: unknown, context: Context) =>
  await app.resolve(event, context);
