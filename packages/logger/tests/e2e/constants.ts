import { randomUUID } from 'node:crypto';

const RESOURCE_NAME_PREFIX = 'Logger';
const STACK_OUTPUT_LOG_GROUP = 'LogGroupName';
const XRAY_TRACE_ID_REGEX = /^1-[0-9a-f]{8}-[0-9a-f]{24}$/;

const commonEnvironmentVars = {
  PERSISTENT_KEY: 'persistentKey',
  RUNTIME_ADDED_KEY: 'foo',
  PERSISTENT_VALUE: randomUUID(),
  REMOVABLE_KEY: 'removableKey',
  REMOVABLE_VALUE: 'removedValue',
  SINGLE_LOG_ITEM_KEY: 'singleKey',
  SINGLE_LOG_ITEM_VALUE: 'singleValue',
  ERROR_MSG: 'error',
  ARBITRARY_OBJECT_KEY: 'arbitraryObjectKey',
  ARBITRARY_OBJECT_DATA: 'arbitraryObjectData',
  PARENT_LOG_MSG: 'parent-only-log-msg',
  CHILD_LOG_MSG: 'child-only-log-msg',
  CHILD_LOG_LEVEL: 'ERROR',
  POWERTOOLS_SERVICE_NAME: 'logger-e2e-testing',
  POWERTOOLS_LOG_LEVEL: 'INFO',
};

export {
  RESOURCE_NAME_PREFIX,
  STACK_OUTPUT_LOG_GROUP,
  XRAY_TRACE_ID_REGEX,
  commonEnvironmentVars,
};
