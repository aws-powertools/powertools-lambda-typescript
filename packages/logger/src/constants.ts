/**
 * The indent level for JSON logs.
 *
 * By default Logger will use the `LogJsonIndent.COMPACT` indent level, which
 * produces logs on a single line. This is the most efficient option for
 * CloudWatch Logs.
 *
 * When enabling the `POWERTOOLS_DEV` environment variable, Logger will use the
 * `LogJsonIndent.PRETTY` indent level, which indents the JSON logs for easier
 * reading.
 */
const LogJsonIndent = {
  PRETTY: 4,
  COMPACT: 0,
} as const;

const LogLevel = {
  TRACE: 'TRACE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SILENT: 'SILENT',
  CRITICAL: 'CRITICAL',
} as const;

/**
 * Numeric values for each log level.
 */
const LogLevelThreshold = {
  TRACE: 6,
  DEBUG: 8,
  INFO: 12,
  WARN: 16,
  ERROR: 20,
  CRITICAL: 24,
  SILENT: 28,
} as const;

/**
 * Reserved keys that are included in every log item when using the default log formatter.
 *
 * These keys are reserved and cannot be overwritten by custom log attributes.
 */
const ReservedKeys = [
  'level',
  'message',
  'sampling_rate',
  'service',
  'timestamp',
];

/**
 * Message logged when an uncaught error occurs in a Lambda function.
 */
const UncaughtErrorLogMessage =
  'Uncaught error detected, flushing log buffer before exit';

export {
  LogJsonIndent,
  LogLevel,
  LogLevelThreshold,
  ReservedKeys,
  UncaughtErrorLogMessage,
};
