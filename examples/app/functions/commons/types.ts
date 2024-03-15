import type { LogItemExtraInput } from '@aws-lambda-powertools/logger/types';

type DebugLogger = {
  debug: (message: string, ...extraInput: LogItemExtraInput) => void;
};

export type { DebugLogger };
