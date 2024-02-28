import { Logger } from '../../src/index.js';
import type { Context } from 'aws-lambda';
import type { LogLevel } from '../../src/types/index.js';
import { TestEvent, TestOutput } from '../helpers/types.js';

const PERSISTENT_KEY = process.env.PERSISTENT_KEY || 'persistentKey';
const PERSISTENT_VALUE = process.env.ERSISTENT_VALUE || 'persistentValue';
const PARENT_LOG_MSG = process.env.PARENT_LOG_MSG || 'parent-only-log-msg';
const CHILD_LOG_MSG = process.env.CHILD_LOG_MSG || 'child-only-log-msg';
const CHILD_LOG_LEVEL = (process.env.CHILD_LOG_LEVEL || 'warn') as LogLevel;

const parentLogger = new Logger({
  persistentLogAttributes: {
    [PERSISTENT_KEY]: PERSISTENT_VALUE,
  },
});

// Create a child logger
const childLogger = parentLogger.createChild({
  logLevel: CHILD_LOG_LEVEL,
});

export const handler = async (
  _event: TestEvent,
  context: Context
): TestOutput => {
  parentLogger.addContext(context);

  childLogger.info(CHILD_LOG_MSG);
  childLogger.error(CHILD_LOG_MSG);
  parentLogger.info(PARENT_LOG_MSG);
  parentLogger.error(PARENT_LOG_MSG);

  return {
    requestId: context.awsRequestId,
  };
};
