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

app.onSubscribe('/private/*', async (info) => {
  const userGroups =
    info.identity?.groups && Array.isArray(info.identity?.groups)
      ? info.identity?.groups
      : [];
  const channelGroup = 'premium-users';

  if (!userGroups.includes(channelGroup)) {
    throw new UnauthorizedException(
      `Subscription requires ${channelGroup} group membership`
    );
  }
});

export const handler = async (event: unknown, context: Context) =>
  await app.resolve(event, context);
