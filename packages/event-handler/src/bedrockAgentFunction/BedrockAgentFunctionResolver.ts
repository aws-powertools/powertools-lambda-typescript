import type { Context } from 'aws-lambda';
import type {
  ToolConfig,
  ToolRegistry,
  ToolDefinition,
  BedrockAgentFunctionRequest,
  ToolFunction,
  BedrockAgentFunctionResponse,
  ResponseOpts,
} from '../types/Tools';

export class BedrockAgentFunctionResolver {
  protected registry: ToolRegistry = new Map<string, ToolDefinition>();

  public tool(fn: ToolFunction, config: ToolConfig) {
    this.registry.set(config.name, { function: fn, config });
  }

  public resolve(
    event: BedrockAgentFunctionRequest,
    context: Context
  ): BedrockAgentFunctionResponse {
    const { function: toolName, parameters, actionGroup } = event;

    const tool = this.registry.get(toolName);

    if (tool === undefined) {
      console.error(`Cant find tool ${tool}`);
      return this.response({
        actionGroup,
        function: toolName,
        responseBody: 'error',
      });
    }

    const parameterObject = parameters.reduce((acc, curr) => {
      acc[curr.name] = curr.value;
      return acc;
    }, {});

    console.debug(`Calling tool ${tool.config.name}`);
    const response = tool.function(parameterObject);

    return this.response({
      actionGroup,
      function: toolName,
      responseBody: response,
    });
  }

  private response(opts: ResponseOpts): BedrockAgentFunctionResponse {
    const {
      actionGroup,
      function: fn,
      responseBody,
      errorType,
      sessionAttributes,
      promptSessionAttributes,
    } = opts;
    return {
      messageVersion: '1.0',
      response: {
        actionGroup,
        function: fn,
        functionResponse: {
          responseState: errorType,
          responseBody: {
            TEXT: {
              body: responseBody,
            },
          },
        },
      },
      sessionAttributes,
      promptSessionAttributes,
    };
  }
}
