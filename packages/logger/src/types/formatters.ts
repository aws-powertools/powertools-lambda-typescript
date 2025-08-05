import type { LogKey } from './logKeys.js';

/**
 * List of keys to order log attributes by.
 *
 * This can be a set of keys or an array of keys.
 */
type LogRecordOrderKeys = Set<LogKey> | LogKey[];

/**
 * Options for the {@link PowertoolsLogFormatter} class.
 */
type PowertoolsLogFormatterOptions = {
  /**
   * An array of keys that defines the order of the log record.
   */
  logRecordOrder?: LogRecordOrderKeys;
};

export type { LogRecordOrderKeys, PowertoolsLogFormatterOptions };
