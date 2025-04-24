import { number } from 'zod';

type ToolConfig = {
  name: string;
  definition: string;
  validation: { input: object; output: object };
  requireConfirmation: boolean | undefined;
};

type ToolDefinition = {
  function: ToolFunction;
  config: ToolConfig;
};

type ToolFunction = Function;

type ToolRegistry = Map<string, ToolDefinition>;

type Parameter = {
  name: string;
  type: string;
  value: string;
};

type BedrockAgentFunctionRequest = {
  messageVersion: string;
  agent: {
    name: string;
    id: string;
    alias: string;
    version: string;
  };
  inputText: string;
  sessionId: string;
  actionGroup: string;
  function: string;
  parameters: Array<Parameter>;
  sessionAttributes: Attributes;
  promptSessionAttributes: Attributes;
};

type Attributes = Map<string, string> | undefined;

type BedrockAgentFunctionResponse = {
  messageVersion: string;
  response: {
    actionGroup: string;
    function: string;
    functionResponse: {
      responseState?: 'ERROR' | 'REPROMPT';
      responseBody: {
        TEXT: {
          body: string;
        };
      };
    };
  };
  sessionAttributes?: Attributes;
  promptSessionAttributes?: Attributes;
};

type ResponseOpts = {
  actionGroup: string;
  function: string;
  responseBody: string;
  errorType?: 'ERROR' | 'REPROMPT';
  sessionAttributes?: Attributes;
  promptSessionAttributes?: Attributes;
};

export type {
  BedrockAgentFunctionRequest,
  ToolConfig,
  ToolRegistry,
  ToolDefinition,
  ToolFunction,
  BedrockAgentFunctionResponse,
  ResponseOpts,
};
