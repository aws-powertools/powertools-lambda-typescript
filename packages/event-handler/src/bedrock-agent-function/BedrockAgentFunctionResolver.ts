import { EnvironmentVariablesService } from '@aws-lambda-powertools/commons';
import type { Context } from 'aws-lambda';
import type {
  BedrockAgentFunctionEvent,
  BedrockAgentFunctionResponse,
  Configuration,
  GenericLogger,
  ResolverOptions,
  ResponseOptions,
  Tool,
  ToolFunction,
} from '../types/index.js';
import { isPrimitive } from './utils.js';

export class BedrockAgentFunctionResolver {
  readonly #tools: Map<string, Tool> = new Map<string, Tool>();
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
   *   definition: 'Greets a person by name',
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
   *   @app.tool({ name: 'greeting', definition: 'Greets a person by name' })
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
  public tool(fn: ToolFunction, config: Configuration): void;
  public tool(config: Configuration): MethodDecorator;
  public tool(
    fnOrConfig: ToolFunction | Configuration,
    config?: Configuration
  ): MethodDecorator | void {
    // When used as a method (not a decorator)
    if (typeof fnOrConfig === 'function') {
      return this.#registerTool(fnOrConfig, config as Configuration);
    }

    // When used as a decorator
    return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
      const toolFn = descriptor.value as ToolFunction;
      this.#registerTool(toolFn, fnOrConfig);
      return descriptor;
    };
  }

  #registerTool(fn: ToolFunction, config: Configuration): void {
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

    this.#tools.set(name, { function: fn, config });
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
    event: BedrockAgentFunctionEvent,
    context: Context
  ): Promise<BedrockAgentFunctionResponse> {
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

    const parameterObject: Record<string, string> = Object.fromEntries(
      parameters.map((param) => [param.name, param.value])
    );

    try {
      const res = (await tool.function(parameterObject)) ?? '';
      const body = isPrimitive(res) ? String(res) : JSON.stringify(res);
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
