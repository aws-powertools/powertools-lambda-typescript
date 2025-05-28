import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { Context } from 'aws-lambda';
import type { BedrockAgentFunctionResolver } from '../bedrock-agent/BedrockAgentFunctionResolver.js';
import type { BedrockFunctionResponse } from '../bedrock-agent/BedrockFunctionResponse.js';
import type { GenericLogger } from '../types/common.js';

/**
 * Configuration for a tool in the Bedrock Agent Function Resolver.
 */
type Configuration = {
  /**
   * The name of the tool, which must be unique across all registered tools.
   */
  name: string;
  /**
   * A description of the tool, which is optional but highly recommended.
   */
  description?: string;
};

/**
 * Parameter for a tool function in the Bedrock Agent Function Resolver.
 * This is used to define the structure of parameters in tool functions.
 */
type Parameter = {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array';
  value: string;
};

/**
 * Primitive types that can be used as parameter values in tool functions.
 * This is used to define the structure of parameters in tool functions.
 */
type ParameterPrimitives = string | number | boolean;

/**
 * Represents a value for a parameter, which can be a primitive type or an array of values.
 * This is used to define the structure of parameters in tool functions.
 */
type ParameterValue = ParameterPrimitives | Array<ParameterValue>;

/**
 * Function to handle tool invocations in the Bedrock Agent Function Resolver.
 */
type ToolFunction<TParams = Record<string, ParameterValue>> = (
  params: TParams,
  options?: {
    event?: BedrockAgentFunctionEvent;
    context?: Context;
  }
) => Promise<JSONValue | BedrockFunctionResponse>;

/**
 * Tool in the Bedrock Agent Function Resolver.
 *
 * Used to register a tool in {@link BedrockAgentFunctionResolver | `BedrockAgentFunctionResolver`}.
 */
type Tool<TParams = Record<string, ParameterValue>> = {
  handler: ToolFunction<TParams>;
  config: Configuration;
};

/**
 * Function invocation in the Bedrock Agent Function Resolver.
 *
 * This is used to define the structure of function invocations in tool functions.
 */
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
 * {
 *   "messageVersion": "1.0",
 *   "actionGroup": "exampleActionGroup",
 *   "function": "getWeather",
 *   "agent": {
 *     "name": "WeatherAgent",
 *     "id": "agent-id-123",
 *     "alias": "v1",
 *     "version": "1.0"
 *   },
 *   "parameters": [{
 *     "name": "location",
 *     "type": "string",
 *     "value": "Seattle"
 *   }],
 *   "inputText": "What's the weather like in Seattle?",
 *   "sessionId": "session-id-456",
 *   "sessionAttributes": {
 *     "userId": "user-789",
 *   },
 *   "promptSessionAttributes": {},
 * }
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
  sessionAttributes: Record<string, JSONValue>;
  promptSessionAttributes: Record<string, JSONValue>;
  knowledgeBasesConfiguration?: Record<string, JSONValue>;
};

/**
 * Represents the state of the response from a Bedrock agent function:
 * - `FAILURE`: The agent throws a `DependencyFailedException` for the current session.
 * - `REPROMPT`: The agent passes a response string to the model to reprompt it.
 */
type ResponseState = 'FAILURE' | 'REPROMPT';

/**
 * Response structure for a Bedrock agent function.
 */
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
  sessionAttributes?: BedrockAgentFunctionEvent['sessionAttributes'];
  promptSessionAttributes?: BedrockAgentFunctionEvent['promptSessionAttributes'];
  knowledgeBasesConfiguration?: BedrockAgentFunctionEvent['knowledgeBasesConfiguration'];
};

/**
 * Options for the {@link BedrockAgentFunctionResolver | `BedrockAgentFunctionResolver`} class
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
  ResponseState,
};
