import { isRecord, isString } from '@aws-lambda-powertools/commons/typeutils';
import type { AppSyncGraphQLEvent } from '../types/appsync-graphql.js';

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
): event is AppSyncGraphQLEvent => {
  if (typeof event !== 'object' || event === null || !isRecord(event)) {
    return false;
  }
  return (
    'arguments' in event &&
    isRecord(event.arguments) &&
    'identity' in event &&
    'source' in event &&
    'result' in event &&
    isRecord(event.request) &&
    isRecord(event.request.headers) &&
    'domainName' in event.request &&
    'prev' in event &&
    isRecord(event.info) &&
    'fieldName' in event.info &&
    isString(event.info.fieldName) &&
    'parentTypeName' in event.info &&
    isString(event.info.parentTypeName) &&
    'variables' in event.info &&
    isRecord(event.info.variables) &&
    'selectionSetList' in event.info &&
    Array.isArray(event.info.selectionSetList) &&
    event.info.selectionSetList.every((item) => isString(item)) &&
    'parentTypeName' in event.info &&
    isString(event.info.parentTypeName) &&
    'stash' in event &&
    isRecord(event.stash)
  );
};

export { isAppSyncGraphQLEvent };
