type LogLevelDebug = 'DEBUG';
type LogLevelInfo = 'INFO';
type LogLevelWarn = 'WARN';
type LogLevelError = 'ERROR';

type LogLevel = LogLevelDebug | LogLevelInfo | LogLevelWarn | LogLevelError;

type LogAttributeValue = string | number | boolean | null | LogAttributeValue[] | { [key: string]: LogAttributeValue };
type LogAttributes = { [key: string]: LogAttributeValue };

type CustomAttributes = LogAttributes;

type PowertoolLog = LogAttributes & {
  timestamp: string
  level: LogLevel
  location: string
  service: string
  sampling_rate: number
  message: string
  xray_trace_id: string
  cold_start?: boolean
  function_name?: string
  function_memory_size?: number
  function_arn?: string
  function_request_id?: string
};

export {
  LogLevel,
  CustomAttributes,
  PowertoolLog
};