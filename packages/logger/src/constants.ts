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
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  SILENT: 'SILENT',
  CRITICAL: 'CRITICAL',
} as const;

export { LogJsonIndent, LogLevel };
