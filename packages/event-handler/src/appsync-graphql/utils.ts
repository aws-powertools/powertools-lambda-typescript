import { isRecord, isString } from '@aws-lambda-powertools/commons/typeutils';
import type { AppSyncResolverEvent } from 'aws-lambda';

/**
 * Type guard to check if the provided event is an AppSync GraphQL event.
 *
 * We use this function to ensure that the event is an object and has the required properties
 * without adding any dependency.
 *
 * @param event - The incoming event to check
 */
const isAppSyncGraphQLEvent = (
  event: unknown
): event is AppSyncResolverEvent<Record<string, unknown>> => {
  if (typeof event !== 'object' || event === null || !isRecord(event)) {
    return false;
  }
  return (
    isRecord(event.arguments) &&
    'identity' in event &&
    'source' in event &&
    isRecord(event.request) &&
    isRecord(event.request.headers) &&
    'domainName' in event.request &&
    'prev' in event &&
    isRecord(event.info) &&
    isString(event.info.fieldName) &&
    isString(event.info.parentTypeName) &&
    isRecord(event.info.variables) &&
    isString(event.info.parentTypeName) &&
    isRecord(event.stash)
  );
};

export { isAppSyncGraphQLEvent };
