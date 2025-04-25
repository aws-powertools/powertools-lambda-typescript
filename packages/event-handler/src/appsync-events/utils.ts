import { isRecord, isString } from '@aws-lambda-powertools/commons/typeutils';
import type {
  AppSyncEventsEvent,
  AppSyncEventsPublishEvent,
} from '../types/appsync-events.js';

/**
 * Type guard to check if the provided event is an AppSync Events event.
 *
 * We use this function to ensure that the event is an object and has the required properties
 * without adding any dependency.
 *
 * @param event - The incoming event to check
 */
const isAppSyncEventsEvent = (event: unknown): event is AppSyncEventsEvent => {
  if (typeof event !== 'object' || event === null || !isRecord(event)) {
    return false;
  }
  return (
    'identity' in event &&
    'result' in event &&
    isRecord(event.request) &&
    isRecord(event.request.headers) &&
    'domainName' in event.request &&
    'error' in event &&
    'prev' in event &&
    isRecord(event.stash) &&
    Array.isArray(event.outErrors) &&
    'events' in event &&
    isRecord(event.info) &&
    isRecord(event.info.channel) &&
    'path' in event.info.channel &&
    isString(event.info.channel.path) &&
    'segments' in event.info.channel &&
    Array.isArray(event.info.channel.segments) &&
    event.info.channel.segments.every((segment) => isString(segment)) &&
    isRecord(event.info.channelNamespace) &&
    'name' in event.info.channelNamespace &&
    isString(event.info.channelNamespace.name) &&
    'operation' in event.info &&
    /* v8 ignore next */
    (event.info.operation === 'PUBLISH' || event.info.operation === 'SUBSCRIBE')
  );
};

/**
 * Type guard to check if the provided event is an AppSync Events publish event.
 *
 * We use this function to ensure that the event is an object and has the required properties
 * without adding any dependency.
 *
 * @param event - The incoming event to check
 */
const isAppSyncEventsPublishEvent = (
  event: AppSyncEventsEvent
): event is AppSyncEventsPublishEvent => {
  return (
    event.info.operation === 'PUBLISH' &&
    Array.isArray(event.events) &&
    event.events.every(
      (e) =>
        isRecord(e) && 'payload' in e && 'id' in e && typeof e.id === 'string'
    )
  );
};

export { isAppSyncEventsEvent, isAppSyncEventsPublishEvent };
