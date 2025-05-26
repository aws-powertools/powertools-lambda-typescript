import { EnvironmentVariablesService } from '@aws-lambda-powertools/commons';
import type { Context } from 'aws-lambda';
import type {
  BedrockAgentFunctionResponse,
  Configuration,
  ParameterValue,
  ResolverOptions,
  ResponseOptions,
  Tool,
  ToolFunction,
} from '../types/bedrock-agent.js';
import type { GenericLogger } from '../types/common.js';
import { assertBedrockAgentFunctionEvent } from './utils.js';

export class BedrockAgentFunctionResolver {
  readonly #tools: Map<string, Tool> = new Map();
  readonly #envService: EnvironmentVariablesService;
  readonly #logger: Pick<GenericLogger, 'debug' | 'warn' | 'error'>;

  constructor(options?: ResolverOptions) {
    this.#envService = new EnvironmentVariablesService();
    const alcLogLevel = this.#envService.get('AWS_LAMBDA_LOG_LEVEL');
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
   * import { BedrockAgentFunctionResolver } from '@aws-lambda-powertools/event-handler/bedrock-agent-function';
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
   * The method also works as a class method decorator:
   *
   * @example
   * ```ts
   * import { BedrockAgentFunctionResolver } from '@aws-lambda-powertools/event-handler/bedrock-agent-function';
   *
   * const app = new BedrockAgentFunctionResolver();
   *
   * class Lambda {
   *   @app.tool({ name: 'greeting', description: 'Greets a person by name' })
   *   async greeting(params) {
   *     const { name } = params;
   *     return `Hello, ${name}!`;
   *   }
   *
   *   async handler(event, context) {
   *     return app.resolve(event, context);
   *   }
   * }
   *
   * const lambda = new Lambda();
   * export const handler = lambda.handler.bind(lambda);
   * ```
   *
   * @param fn - The tool function
   * @param config - The configuration object for the tool
   */
  public tool<TParams extends Record<string, ParameterValue>>(
    fn: ToolFunction<TParams>,
    config: Configuration
  ): undefined;
  public tool<TParams extends Record<string, ParameterValue>>(
    config: Configuration
  ): MethodDecorator;
  public tool<TParams extends Record<string, ParameterValue>>(
    fnOrConfig: ToolFunction<TParams> | Configuration,
    config?: Configuration
  ): MethodDecorator | undefined {
    // When used as a method (not a decorator)
    if (typeof fnOrConfig === 'function') {
      this.#registerTool(fnOrConfig, config as Configuration);
      return;
    }

    // When used as a decorator
    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      const toolFn = descriptor.value as ToolFunction;
      this.#registerTool(toolFn, fnOrConfig);
      return descriptor;
    };
  }

  #registerTool<TParams extends Record<string, ParameterValue>>(
    handler: ToolFunction<TParams>,
    config: Configuration
  ): void {
    const { name } = config;

    if (this.#tools.size >= 5) {
      this.#logger.warn(
        `The maximum number of tools that can be registered is 5. Tool ${name} will not be registered.`
      );
      return;
    }

    if (this.#tools.has(name)) {
      this.#logger.warn(
        `Tool ${name} already registered. Overwriting with new definition.`
      );
    }

    this.#tools.set(name, {
      handler: handler as ToolFunction,
      config,
    });
    this.#logger.debug(`Tool ${name} has been registered.`);
  }

  #buildResponse(options: ResponseOptions): BedrockAgentFunctionResponse {
    const {
      actionGroup,
      function: func,
      body,
      errorType,
      sessionAttributes,
      promptSessionAttributes,
    } = options;

    return {
      messageVersion: '1.0',
      response: {
        actionGroup,
        function: func,
        functionResponse: {
          responseState: errorType,
          responseBody: {
            TEXT: {
              body,
            },
          },
        },
      },
      sessionAttributes,
      promptSessionAttributes,
    };
  }

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
    } = event;

    const tool = this.#tools.get(toolName);

    if (tool == null) {
      this.#logger.error(`Tool ${toolName} has not been registered.`);
      return this.#buildResponse({
        actionGroup,
        function: toolName,
        body: 'Error: tool has not been registered in handler.',
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
        // because we cannot reliably parse them
        default: {
          toolParams[param.name] = param.value;
          break;
        }
      }
    }

    try {
      const res = await tool.handler(toolParams, { event, context });
      const body = res == null ? '' : JSON.stringify(res);
      return this.#buildResponse({
        actionGroup,
        function: toolName,
        body,
        sessionAttributes,
        promptSessionAttributes,
      });
    } catch (error) {
      this.#logger.error(`An error occurred in tool ${toolName}.`, error);
      return this.#buildResponse({
        actionGroup,
        function: toolName,
        body: `Error when invoking tool: ${error}`,
        sessionAttributes,
        promptSessionAttributes,
      });
    }
  }
}
