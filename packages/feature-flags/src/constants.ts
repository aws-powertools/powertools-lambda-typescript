/** Names the built-in Stores. @internal */
const StoreNames = {
  RULE_ENGINE: 'rule-engine',
  APPCONFIG: 'appconfig',
  APPCONFIG_AGENT: 'appconfig-agent',
} as const;

/** Names the fields in a Python-format Flag Document. @internal */
const FlagDocumentFields = {
  DEFAULT: 'default',
  BOOLEAN_TYPE: 'boolean_type',
  RULES: 'rules',
  WHEN_MATCH: 'when_match',
  CONDITIONS: 'conditions',
  ACTION: 'action',
  KEY: 'key',
  VALUE: 'value',
} as const;

/** Names the supported Actions. @internal */
const RuleActions = {
  EQUALS: 'EQUALS',
  NOT_EQUALS: 'NOT_EQUALS',
  KEY_GREATER_THAN_VALUE: 'KEY_GREATER_THAN_VALUE',
  KEY_GREATER_THAN_OR_EQUAL_VALUE: 'KEY_GREATER_THAN_OR_EQUAL_VALUE',
  KEY_LESS_THAN_VALUE: 'KEY_LESS_THAN_VALUE',
  KEY_LESS_THAN_OR_EQUAL_VALUE: 'KEY_LESS_THAN_OR_EQUAL_VALUE',
  STARTSWITH: 'STARTSWITH',
  ENDSWITH: 'ENDSWITH',
  IN: 'IN',
  NOT_IN: 'NOT_IN',
  KEY_IN_VALUE: 'KEY_IN_VALUE',
  KEY_NOT_IN_VALUE: 'KEY_NOT_IN_VALUE',
  VALUE_IN_KEY: 'VALUE_IN_KEY',
  VALUE_NOT_IN_KEY: 'VALUE_NOT_IN_KEY',
  ALL_IN_VALUE: 'ALL_IN_VALUE',
  ANY_IN_VALUE: 'ANY_IN_VALUE',
  NONE_IN_VALUE: 'NONE_IN_VALUE',
  SCHEDULE_BETWEEN_TIME_RANGE: 'SCHEDULE_BETWEEN_TIME_RANGE',
  SCHEDULE_BETWEEN_DATETIME_RANGE: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
  SCHEDULE_BETWEEN_DAYS_OF_WEEK: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
  MODULO_RANGE: 'MODULO_RANGE',
} as const;

/** Maps schedule Actions to their fixed clock keys. @internal */
const TimeActionKeys = {
  SCHEDULE_BETWEEN_TIME_RANGE: 'CURRENT_TIME',
  SCHEDULE_BETWEEN_DATETIME_RANGE: 'CURRENT_DATETIME',
  SCHEDULE_BETWEEN_DAYS_OF_WEEK: 'CURRENT_DAY_OF_WEEK',
} as const;

/** Lists Python's TimeValues.days(), including its harmless DAYS entry. @internal */
const TimeDays = [
  'DAYS',
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

/** Lists retrieval error names that identify availability failures. @internal */
const AvailabilityErrorNames = [
  'ThrottlingException',
  'TooManyRequestsException',
  'InternalServerException',
  'ServiceUnavailableException',
  'TimeoutError',
  'AbortError',
] as const;

/** Lists Node network error codes that identify availability failures. @internal */
const AvailabilityErrorCodes = [
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
] as const;

export {
  AvailabilityErrorCodes,
  AvailabilityErrorNames,
  FlagDocumentFields,
  RuleActions,
  StoreNames,
  TimeActionKeys,
  TimeDays,
};
