type LogLevelDebug = 'DEBUG';
type LogLevelInfo = 'INFO';
type LogLevelWarn = 'WARN';
type LogLevelError = 'ERROR';
type LogLevelSilent = 'SILENT';
type LogLevelCritical = 'CRITICAL';

type LogLevel =
  LogLevelDebug |
  Lowercase<LogLevelDebug> |
  LogLevelInfo |
  Lowercase<LogLevelInfo> |
  LogLevelWarn |
  Lowercase<LogLevelWarn> |
  LogLevelError |
  Lowercase<LogLevelError> |
  LogLevelSilent |
  Lowercase<LogLevelSilent> |
  LogLevelCritical |
  Lowercase<LogLevelCritical>;

type LogLevelThresholds = {
  [key in Uppercase<LogLevel>]: number;
};

type LogAttributeValue = unknown;
type LogAttributes = { [key: string]: LogAttributeValue };

type LogAttributesWithMessage = LogAttributes & {
  message: string
};

type Environment = 'dev' | 'local' | 'staging' | 'prod' | string;

export type {
  LogAttributesWithMessage,
  LogAttributeValue,
  Environment,
  LogLevelThresholds,
  LogAttributes,
  LogLevel,
};