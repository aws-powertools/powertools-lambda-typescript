import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';
import type { GenericLogger } from '../types/common.js';

type Configuration = {
  name: string;
  description: string;
};

type Parameter = {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array';
  value: string;
};

type ParameterPrimitives = string | number | boolean;

type ParameterValue = ParameterPrimitives | Array<ParameterValue>;

type ToolFunction<TParams = Record<string, ParameterValue>> = (
  params: TParams,
  event: BedrockAgentFunctionEvent,
  context: Context
  // biome-ignore lint/suspicious/noConfusingVoidType: we need to support async functions that don't have an explicit return value
) => Promise<JSONValue | void>;

type Tool<TParams = Record<string, ParameterValue>> = {
  handler: ToolFunction<TParams>;
  config: Configuration;
};

type Attributes = Record<string, string>;

type FunctionIdentifier = {
  actionGroup: string;
  function: string;
};

type FunctionInvocation = FunctionIdentifier & {
  parameters?: Array<Parameter>;
};

type BedrockAgentFunctionEvent = FunctionInvocation & {
  messageVersion: string;
  agent: {
    name: string;
    id: string;
    alias: string;
    version: string;
  };
  inputText: string;
  sessionId: string;
  sessionAttributes: Attributes;
  promptSessionAttributes: Attributes;
};

type ResponseState = 'ERROR' | 'REPROMPT';

type TextResponseBody = {
  TEXT: {
    body: string;
  };
};

type SessionData = {
  sessionAttributes?: Attributes;
  promptSessionAttributes?: Attributes;
};

type BedrockAgentFunctionResponse = SessionData & {
  messageVersion: string;
  response: FunctionIdentifier & {
    functionResponse: {
      responseState?: ResponseState;
      responseBody: TextResponseBody;
    };
  };
};

type ResponseOptions = FunctionIdentifier &
  SessionData & {
    body: string;
    errorType?: ResponseState;
  };

/**
 * Options for the {@link BedrockAgentFunctionResolver} class
 */
type ResolverOptions = {
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  logger?: GenericLogger;
};

export type {
  Configuration,
  Tool,
  ToolFunction,
  Parameter,
  Attributes,
  ParameterValue,
  FunctionIdentifier,
  FunctionInvocation,
  BedrockAgentFunctionEvent,
  BedrockAgentFunctionResponse,
  ResponseOptions,
  ResolverOptions,
};
