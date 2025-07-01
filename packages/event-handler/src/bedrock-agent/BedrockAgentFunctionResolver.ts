import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import { isNullOrUndefined } from '@aws-lambda-powertools/commons/typeutils';
import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import type { Context } from 'aws-lambda';
import type {
  BedrockAgentFunctionResponse,
  Configuration,
  ParameterValue,
  ResolverOptions,
  Tool,
  ToolFunction,
} from '../types/bedrock-agent.js';
import { BedrockFunctionResponse } from './BedrockFunctionResponse.js';
import { assertBedrockAgentFunctionEvent } from './utils.js';

/**
 * Resolver for AWS Bedrock Agent Function invocations.
 *
 * This resolver is designed to handle function invocations from Bedrock Agents.
 *
 * @example
 * ```ts
 * import {
 *   BedrockAgentFunctionResolver
 * } from '@aws-lambda-powertools/event-handler/bedrock-agent';
 *
 * const app = new BedrockAgentFunctionResolver();
 *
 * app.tool(async (params) => {
 *   const { name } = params;
 *   return `Hello, ${name}!`;
 * }, {
 *   name: 'greeting',
 *   description: 'Greets a person by name',
 * });
 *
 * export const handler = async (event, context) =>
 *   app.resolve(event, context);
 * ```
 */
class BedrockAgentFunctionResolver {
  /**
   * Registry of tools added to the Bedrock Agent Function Resolver.
   */
  readonly #tools: Map<string, Tool> = new Map();
  /**
   * A logger instance to be used for logging debug, warning, and error messages.
   *
   * When no logger is provided, we'll only log warnings and errors using the global `console` object.
   */
  readonly #logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;

  constructor(options?: ResolverOptions) {
    const alcLogLevel = getStringFromEnv({
      key: 'AWS_LAMBDA_LOG_LEVEL',
      defaultValue: '',
    });
    this.#logger = options?.logger ?? {
      debug: alcLogLevel === 'DEBUG' ? console.debug : () => {},
      error: console.error,
      warn: console.warn,
    };
  }

  /**
   * Register a tool function for the Bedrock Agent.
   *
   * This method registers a function that can be invoked by a Bedrock Agent.
   *
   * @example
   * ```ts
   * import {
   *   BedrockAgentFunctionResolver
   * } from '@aws-lambda-powertools/event-handler/bedrock-agent';
   *
   * const app = new BedrockAgentFunctionResolver();
   *
   * app.tool(async (params) => {
   *   const { name } = params;
   *   return `Hello, ${name}!`;
   * }, {
   *   name: 'greeting',
   *   description: 'Greets a person by name',
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * If you know the function signature, you can also use a type parameter to specify the parameters of the tool function:
   *
   * @example
   * ```ts
   * import {
   *   BedrockAgentFunctionResolver,
   * } from '@aws-lambda-powertools/event-handler/bedrock-agent';
   *
   * const app = new BedrockAgentFunctionResolver();
   *
   * app.tool<{ name: string }>(async (params) => {
   *   const { name } = params;
   *   //      ^ name: string
   *   return `Hello, ${name}!`;
   * }, {
   *   name: 'greeting',
   *   description: 'Greets a person by name',
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * When defining a tool, you can also access the original `event` and `context` objects from the Bedrock Agent function invocation.
   * This is useful if you need to access the session attributes or other context-specific information.
   *
   * @example
   * ```ts
   * import {
   *   BedrockAgentFunctionResolver
   * } from '@aws-lambda-powertools/event-handler/bedrock-agent';
   *
   * const app = new BedrockAgentFunctionResolver();
   *
   * app.tool(async (params, { event, context }) => {
   *   const { name } = params;
   *   // Access session attributes from the event
   *   const sessionAttributes = event.sessionAttributes || {};
   *   // You can also access the context if needed
   *   sessionAttributes.requestId = context.awsRequestId;
   *
   *   return `Hello, ${name}!`;
   * }, {
   *   name: 'greetingWithContext',
   *   description: 'Greets a person by name',
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * @param fn - The tool function
   * @param config - The configuration object for the tool
   * @param config.name - The name of the tool, which must be unique across all registered tools.
   * @param config.description - A description of the tool, which is optional but highly recommended.
   */
  public tool<TParams extends Record<string, ParameterValue>>(
    fn: ToolFunction<TParams>,
    config: Configuration
  ): undefined {
    const { name } = config;
    if (this.#tools.has(name)) {
      this.#logger.warn(
        `Tool "${name}" already registered. Overwriting with new definition.`
      );
    }

    this.#tools.set(name, {
      handler: fn as ToolFunction,
      config,
    });
    this.#logger.debug(`Tool "${name}" has been registered.`);
  }

  /**
   * Resolve an incoming Bedrock Agent function invocation event.
   *
   * @example
   * ```ts
   * import {
   *   BedrockAgentFunctionResolver
   * } from '@aws-lambda-powertools/event-handler/bedrock-agent';
   *
   * const app = new BedrockAgentFunctionResolver();
   *
   * app.tool(async (params) => {
   *   const { name } = params;
   *   return `Hello, ${name}!`;
   * }, {
   *   name: 'greeting',
   *   description: 'Greets a person by name',
   * });
   *
   * export const handler = async (event, context) =>
   *   app.resolve(event, context);
   * ```
   *
   * @param event - The incoming payload of the AWS Lambda function.
   * @param context - The context object provided by AWS Lambda, which contains information about the invocation, function, and execution environment.
   */
  async resolve(
    event: unknown,
    context: Context
  ): Promise<BedrockAgentFunctionResponse> {
    assertBedrockAgentFunctionEvent(event);

    const {
      function: toolName,
      parameters = [],
      actionGroup,
      sessionAttributes,
      promptSessionAttributes,
      knowledgeBasesConfiguration,
    } = event;

    const tool = this.#tools.get(toolName);

    if (tool == null) {
      this.#logger.error(`Tool "${toolName}" has not been registered.`);
      return new BedrockFunctionResponse({
        body: `Error: tool "${toolName}" has not been registered.`,
        sessionAttributes,
        promptSessionAttributes,
        knowledgeBasesConfiguration,
      }).build({
        actionGroup,
        func: toolName,
      });
    }

    const toolParams: Record<string, ParameterValue> = {};
    for (const param of parameters) {
      switch (param.type) {
        case 'boolean': {
          toolParams[param.name] = param.value === 'true';
          break;
        }
        case 'number':
        case 'integer': {
          toolParams[param.name] = Number(param.value);
          break;
        }
        // this default will also catch array types but we leave them as strings
        // because we cannot reliably parse them - see discussion in #3710
        default: {
          toolParams[param.name] = param.value;
          break;
        }
      }
    }

    try {
      const response = await tool.handler(toolParams, { event, context });
      if (response instanceof BedrockFunctionResponse) {
        return response.build({
          actionGroup,
          func: toolName,
        });
      }
      const body =
        isNullOrUndefined(response) || response === ''
          ? ''
          : JSON.stringify(response);
      return new BedrockFunctionResponse({
        body,
        sessionAttributes,
        promptSessionAttributes,
        knowledgeBasesConfiguration,
      }).build({
        actionGroup,
        func: toolName,
      });
    } catch (error) {
      this.#logger.error(`An error occurred in tool ${toolName}.`, error);
      const errorMessage =
        error instanceof Error
          ? `${error.name} - ${error.message}`
          : String(error);
      return new BedrockFunctionResponse({
        body: `Unable to complete tool execution due to ${errorMessage}`,
        sessionAttributes,
        promptSessionAttributes,
        knowledgeBasesConfiguration,
      }).build({
        actionGroup,
        func: toolName,
      });
    }
  }
}

export { BedrockAgentFunctionResolver };
