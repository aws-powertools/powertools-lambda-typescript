import type { EnvironmentVariablesService } from '../config/EnvironmentVariablesService.js';
import type { LogFormatter } from '../formatter/LogFormatter.js';
import type { LogKey } from './logKeys.js';

/**
 * Options for the {@link LogFormatter} class.
 */
type LogFormatterOptions = {
  /**
   * Instance of the {@link EnvironmentVariablesService} to use for configuration.
   */
  envVarsService?: EnvironmentVariablesService;
};

/**
 * List of keys to order log attributes by.
 *
 * This can be a set of keys or an array of keys.
 */
type LogRecordOrderKeys = Set<LogKey> | LogKey[];

/**
 * Options for the {@link PowertoolsLogFormatter} class.
 */
type PowertoolsLogFormatterOptions = LogFormatterOptions & {
  /**
   * An array of keys that defines the order of the log record.
   */
  logRecordOrder?: LogRecordOrderKeys;
};

export type {
  LogFormatterOptions,
  PowertoolsLogFormatterOptions,
  LogRecordOrderKeys,
};
