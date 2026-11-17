import type { JSONValue } from '@aws-lambda-powertools/commons/types';

/**
 * Copy a response with the serialization semantics of the persistence stores.
 *
 * The stores keep a JSON representation of the response, so the copy is made with a
 * JSON round trip: a response replayed from the local cache is then the same value as
 * the one replayed by an execution environment that reads the record from the store.
 *
 * @param response - the response to copy
 */
const copyResponse = (response: JSONValue): JSONValue => {
  const serialized = JSON.stringify(response);

  return serialized === undefined ? undefined : JSON.parse(serialized);
};

export { copyResponse };
