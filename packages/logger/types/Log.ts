type LogLevelDebug = 'DEBUG';
type LogLevelInfo = 'INFO';
type LogLevelWarn = 'WARN';
type LogLevelError = 'ERROR';

type LogLevel = LogLevelDebug | LogLevelInfo | LogLevelWarn | LogLevelError | string;

type LogLevelThresholds = {
  [key in LogLevel]: number;
};

type LogAttributeValue = string | number | boolean | null | undefined | LogAttributeValue[] | { [key: string]: LogAttributeValue } | Error;
type LogAttributes = { [key: string]: LogAttributeValue };

type LogAttributesWithMessage = LogAttributes & {
  message: string
};

type Environment = 'dev' | 'local' | 'staging' | 'prod' | string;

export {
  LogAttributesWithMessage,
  LogAttributeValue,
  Environment,
  LogLevelThresholds,
  LogAttributes,
  LogLevel
};