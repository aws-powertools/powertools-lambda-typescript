import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';
import type { BedrockAgentFunctionResolver } from '../bedrock-agent/BedrockAgentFunctionResolver.js';
import type { BedrockFunctionResponse } from '../bedrock-agent/BedrockFunctionResponse.js';
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
  options?: {
    event?: BedrockAgentFunctionEvent;
    context?: Context;
  }
) => Promise<JSONValue | BedrockFunctionResponse>;

type Tool<TParams = Record<string, ParameterValue>> = {
  handler: ToolFunction<TParams>;
  config: Configuration;
};

type FunctionInvocation = {
  actionGroup: string;
  function: string;
  parameters?: Array<Parameter>;
};

/**
 * Event structure for Bedrock Agent Function invocations.
 *
 * @example
 * ```json
 *
 * ```
 */
type BedrockAgentFunctionEvent = {
  actionGroup: string;
  function: string;
  messageVersion: string;
  agent: {
    name: string;
    id: string;
    alias: string;
    version: string;
  };
  parameters?: Array<Parameter>;
  inputText: string;
  sessionId: string;
  sessionAttributes: Record<string, string>;
  promptSessionAttributes: Record<string, string>;
};

type ResponseState = 'FAILURE' | 'REPROMPT';

type BedrockAgentFunctionResponse = {
  messageVersion: string;
  response: {
    actionGroup: string;
    function: string;
    functionResponse: {
      responseState?: ResponseState;
      responseBody: {
        TEXT: {
          body: string;
        };
      };
    };
  };
  sessionAttributes?: Record<string, string>;
  promptSessionAttributes?: Record<string, string>;
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
  ParameterValue,
  FunctionInvocation,
  BedrockAgentFunctionEvent,
  BedrockAgentFunctionResponse,
  ResolverOptions,
};
