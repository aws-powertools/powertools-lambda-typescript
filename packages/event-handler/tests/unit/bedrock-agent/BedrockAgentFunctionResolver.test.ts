import context from '@aws-lambda-powertools/testing-utils/context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BedrockFunctionResponse } from '../../../src/bedrock-agent/BedrockFunctionResponse.js';
import { BedrockAgentFunctionResolver } from '../../../src/bedrock-agent/index.js';
import type {
  Configuration,
  Parameter,
  ToolFunction,
} from '../../../src/types/bedrock-agent.js';

function createEvent(functionName: string, parameters?: Parameter[]) {
  return {
    messageVersion: '1.0',
    agent: {
      name: 'agentName',
      id: 'agentId',
      alias: 'agentAlias',
      version: '1',
    },
    sessionId: 'sessionId',
    inputText: 'inputText',
    function: functionName,
    ...(parameters == null ? {} : { parameters }),
    actionGroup: 'myActionGroup',
    sessionAttributes: {},
    promptSessionAttributes: {},
  };
}

describe('Class: BedrockAgentFunctionResolver', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    {
      name: 'null event',
      invalidEvent: null,
    },
    {
      name: 'missing required fields',
      invalidEvent: {
        function: 'test-tool',
      },
    },
    {
      name: 'invalid parameters structure',
      invalidEvent: {
        function: 'test-tool',
        actionGroup: 'testGroup',
        messageVersion: '1.0',
        agent: {
          name: 'agentName',
          id: 'agentId',
          alias: 'agentAlias',
          version: '1',
        },
        inputText: 'test input',
        sessionId: 'session123',
        parameters: 'not an array',
        sessionAttributes: {},
        promptSessionAttributes: {},
      },
    },
  ])('throws when given an invalid event: $name', async ({ invalidEvent }) => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(async () => 'test', {
      name: 'test-tool',
      description: 'Test tool',
    });

    // Act & Assert
    await expect(app.resolve(invalidEvent, context)).rejects.toThrow(
      'Event is not a valid BedrockAgentFunctionEvent'
    );
  });

  it('uses a default logger with only warnings if none is provided', () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(
      (params: { arg: string }) => {
        return params.arg;
      },
      {
        name: 'identity',
        description: 'Returns its arg',
      }
    );

    // Assess
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('emits debug message when AWS_LAMBDA_LOG_LEVEL is set to DEBUG', () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');
    const app = new BedrockAgentFunctionResolver();

    app.tool(
      (params: { arg: string }) => {
        return params.arg;
      },
      {
        name: 'identity',
        description: 'Returns its arg',
      }
    );

    // Assess
    expect(console.debug).toHaveBeenCalled();
  });

  it('overwrites tools with the same name and uses the latest definition', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    const event = createEvent('math', [
      {
        name: 'a',
        type: 'number',
        value: '10',
      },
      {
        name: 'b',
        type: 'number',
        value: '2',
      },
    ]);

    app.tool(
      (params: { a: number; b: number }) => {
        return params.a + params.b;
      },
      {
        name: 'math',
        description: 'Adds two numbers',
      }
    );

    const addResult = await app.resolve(event, context);
    expect(addResult.response.function).toEqual('math');
    expect(addResult.response.functionResponse.responseBody.TEXT.body).toEqual(
      '12'
    );

    app.tool(
      (params: { a: number; b: number }) => {
        return params.a * params.b;
      },
      {
        name: 'math',
        description: 'Multiplies two numbers',
      }
    );

    const multiplyResult = await app.resolve(event, context);
    expect(multiplyResult.response.function).toEqual('math');
    expect(
      multiplyResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('20');
  });

  it('accepts custom logger', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');

    const logger = {
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const app = new BedrockAgentFunctionResolver({ logger });

    app.tool(
      (params: { arg: string }) => {
        return params.arg;
      },
      {
        name: 'identity',
        description: 'Returns its arg',
      }
    );

    app.tool(
      (params: { arg: string }) => {
        return params.arg;
      },
      {
        name: 'identity',
        description: 'Returns its arg',
      }
    );

    app.tool(
      () => {
        throw new Error('test error');
      },
      {
        name: 'error',
        description: 'errors',
      }
    );

    // Act
    await app.resolve(createEvent('noop'), context);
    await app.resolve(createEvent('error'), context).catch(() => {});

    // Assess
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalled();
  });

  it('tool function has access to the event variable', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(
      (_params, options) => {
        return options?.event;
      },
      {
        name: 'event-accessor',
        description: 'Accesses the event object',
      }
    );

    const event = createEvent('event-accessor');

    // Act
    const result = await app.resolve(event, context);

    // Assess
    expect(result.response.function).toEqual('event-accessor');
    expect(result.response.functionResponse.responseBody.TEXT.body).toEqual(
      JSON.stringify(event)
    );
  });

  it.each([
    {
      toolFunction: async () => ({
        name: 'John Doe',
        age: 30,
        isActive: true,
        address: {
          street: '123 Main St',
          city: 'Anytown',
        },
      }),
      toolParams: {
        name: 'object',
        description: 'Returns an object',
      },
      expected:
        '{"name":"John Doe","age":30,"isActive":true,"address":{"street":"123 Main St","city":"Anytown"}}',
    },
    {
      toolFunction: async () => [1, 'two', false, null],
      toolParams: {
        name: 'array',
        description: 'Returns an array',
      },
      expected: '[1,"two",false,null]',
    },
  ])(
    'handles function that returns $toolParams.name',
    async ({ toolFunction, toolParams, expected }) => {
      // Prepare
      const app = new BedrockAgentFunctionResolver();

      app.tool(toolFunction, toolParams);

      // Act
      const actual = await app.resolve(createEvent(toolParams.name), context);

      // Asses
      expect(actual.response.function).toEqual(toolParams.name);
      expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
        expected
      );
    }
  );

  it.each([
    {
      toolFunction: async () => null,
      toolParams: {
        name: 'null',
        description: 'Returns null',
      },
    },
    {
      toolFunction: async () => void 0,
      toolParams: {
        name: 'undefined',
        description: 'Returns undefined',
      },
    },
    {
      toolFunction: async () => '',
      toolParams: {
        name: 'empty-string',
        description: 'Returns empty string',
      },
    },
  ])(
    'handles functions that return $toolParams.name by returning an empty string',
    async ({ toolFunction, toolParams }) => {
      // Prepare
      const app = new BedrockAgentFunctionResolver();

      app.tool(toolFunction, toolParams);

      // Assess
      const actual = await app.resolve(createEvent(toolParams.name), context);

      // Act
      expect(actual.response.function).toEqual(toolParams.name);
      expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
        ''
      );
    }
  );

  it('handles functions that return a BedrockAgentFunctionResponse', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(
      () => {
        return new BedrockFunctionResponse({
          body: 'I am not sure',
          responseState: 'REPROMPT',
          sessionAttributes: { customAttr: 'value' },
          promptSessionAttributes: { customPromptAttr: 'promptValue' },
        });
      },
      {
        name: 'custom-response',
        description: 'Returns a custom BedrockAgentFunctionResponse',
      }
    );

    // Act
    const result = await app.resolve(createEvent('custom-response'), context);

    // Assess
    expect(result.response.function).toEqual('custom-response');
    expect(result.response.functionResponse.responseBody.TEXT.body).toEqual(
      'I am not sure'
    );
  });

  it('correctly parses boolean parameters', async () => {
    // Prepare
    const toolFunction: ToolFunction<{ arg: boolean }> = async (
      params,
      _options
    ) => params.arg;

    const toolParams: Configuration = {
      name: 'boolean',
      description: 'Handles boolean parameters',
    };

    const parameters: Parameter[] = [
      { name: 'arg', type: 'boolean', value: 'true' },
    ];

    const app = new BedrockAgentFunctionResolver();
    app.tool(toolFunction, toolParams);

    //Act
    const actual = await app.resolve(
      createEvent(toolParams.name, parameters),
      context
    );

    // Assess
    expect(actual.response.function).toEqual(toolParams.name);
    expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
      'true'
    );
  });

  it('correctly parses number parameters', async () => {
    // Prepare
    const toolFunction: ToolFunction<{ arg: number }> = async (
      params,
      _options
    ) => params.arg + 10;

    const toolParams: Configuration = {
      name: 'number',
      description: 'Handles number parameters',
    };

    const parameters: Parameter[] = [
      { name: 'arg', type: 'number', value: '42' },
    ];

    const app = new BedrockAgentFunctionResolver();
    app.tool(toolFunction, toolParams);

    // Act
    const actual = await app.resolve(
      createEvent(toolParams.name, parameters),
      context
    );

    // Assess
    expect(actual.response.function).toEqual(toolParams.name);
    expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
      '52'
    );
  });

  it('correctly parses integer parameters', async () => {
    // Prepare
    const toolFunction: ToolFunction<{ arg: number }> = async (
      params,
      _options
    ) => params.arg + 10;

    const toolParams: Configuration = {
      name: 'integer',
      description: 'Handles integer parameters',
    };

    const parameters: Parameter[] = [
      { name: 'arg', type: 'integer', value: '37' },
    ];

    const app = new BedrockAgentFunctionResolver();
    app.tool(toolFunction, toolParams);

    // Act
    const actual = await app.resolve(
      createEvent(toolParams.name, parameters),
      context
    );

    // Assess
    expect(actual.response.function).toEqual(toolParams.name);
    expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
      '47'
    );
  });

  it('correctly parses string parameters', async () => {
    // Prepare
    const toolFunction: ToolFunction<{ arg: string }> = async (
      params,
      _options
    ) => `String: ${params.arg}`;

    const toolParams: Configuration = {
      name: 'string',
      description: 'Handles string parameters',
    };

    const parameters: Parameter[] = [
      { name: 'arg', type: 'string', value: 'hello world' },
    ];

    const app = new BedrockAgentFunctionResolver();
    app.tool(toolFunction, toolParams);

    // Act
    const actual = await app.resolve(
      createEvent(toolParams.name, parameters),
      context
    );

    // Assess
    expect(actual.response.function).toEqual(toolParams.name);
    expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
      '"String: hello world"'
    );
  });

  it('correctly parses array parameters', async () => {
    // Prepare
    const toolFunction: ToolFunction<{ arg: string }> = async (
      params,
      _options
    ) => `Array as string: ${params.arg}`;

    const toolParams: Configuration = {
      name: 'array',
      description: 'Handles array parameters (as string)',
    };

    const parameters: Parameter[] = [
      { name: 'arg', type: 'array', value: '[1,2,3]' },
    ];

    const app = new BedrockAgentFunctionResolver();
    app.tool(toolFunction, toolParams);

    // Act
    const actual = await app.resolve(
      createEvent(toolParams.name, parameters),
      context
    );

    // Assess
    expect(actual.response.function).toEqual(toolParams.name);
    expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
      '"Array as string: [1,2,3]"'
    );
  });

  it.each([
    {
      label: 'actual error',
      toThrow: new Error('Something went wrong'),
      expected:
        'Unable to complete tool execution due to Error - Something went wrong',
    },
    {
      label: 'string',
      toThrow: 'Something went wrong',
      expected: 'Unable to complete tool execution due to Something went wrong',
    },
  ])(
    'handles functions that throw errors $label',
    async ({ toThrow, expected }) => {
      // Prepare
      const app = new BedrockAgentFunctionResolver();

      app.tool(
        (_params, _options) => {
          throw toThrow;
        },
        {
          name: 'error-tool',
          description: 'Throws an error',
        }
      );

      // Act
      const actual = await app.resolve(createEvent('error-tool', []), context);

      // Assess
      expect(actual.response.function).toEqual('error-tool');
      expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
        expected
      );
      expect(console.error).toHaveBeenCalledWith(
        'An error occurred in tool error-tool.',
        new Error('Something went wrong')
      );
    }
  );

  it('returns a fully structured BedrockAgentFunctionResponse', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(
      (params, _options) => {
        return `Hello, ${params.name}!`;
      },
      {
        name: 'greeting',
        description: 'Greets a person by name',
      }
    );

    const customEvent = {
      ...createEvent('greeting', [
        {
          name: 'name',
          type: 'string',
          value: 'John',
        },
      ]),
      actionGroup: 'actionGroup',
      sessionAttributes: {
        sessionAttr: '12345',
      },
      promptSessionAttributes: {
        promptAttr: 'promptAttr',
      },
      knowledgeBasesConfiguration: {
        knowledgeBase1: { enabled: true },
        knowledgeBase2: { enabled: false },
      },
    };

    // Act
    const result = await app.resolve(customEvent, context);

    // Assess
    expect(result).toEqual({
      messageVersion: '1.0',
      response: {
        actionGroup: 'actionGroup',
        function: 'greeting',
        functionResponse: {
          responseBody: {
            TEXT: {
              body: '"Hello, John!"',
            },
          },
        },
      },
      sessionAttributes: customEvent.sessionAttributes,
      promptSessionAttributes: customEvent.promptSessionAttributes,
      knowledgeBasesConfiguration: customEvent.knowledgeBasesConfiguration,
    });
  });
});
