import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BedrockAgentFunctionResolver } from '../../../src/bedrock-agent/index.js';
import type {
  BedrockAgentFunctionEvent,
  Configuration,
  Parameter,
  ToolFunction,
} from '../../../src/types/bedrock-agent';

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
      async (params: { arg: string }) => {
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
      async (params: { arg: string }) => {
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

  it('only allows five tools to be registered', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    for (const num of [1, 2, 3, 4, 5]) {
      app.tool(
        async (params: { arg: string }) => {
          return params.arg;
        },
        {
          name: `identity${num}`,
          description: 'Returns its arg',
        }
      );
    }

    app.tool(
      async (params: { a: number; b: number }) => {
        return params.a + params.b;
      },
      {
        name: 'mult',
        description: 'Multiplies two numbers',
      }
    );

    const event = createEvent('mult', [
      {
        name: 'a',
        type: 'number',
        value: '1',
      },
      {
        name: 'b',
        type: 'number',
        value: '2',
      },
    ]);

    // Act
    const actual = await app.resolve(event, context);

    // Assess
    expect(console.warn).toHaveBeenLastCalledWith(
      'The maximum number of tools that can be registered is 5. Tool mult will not be registered.'
    );
    expect(actual.response.function).toEqual('mult');
    expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
      'Error: tool has not been registered in handler.'
    );
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
      async (params: { a: number; b: number }) => {
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
      async (params: { a: number; b: number }) => {
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
      async (params: { arg: string }) => {
        return params.arg;
      },
      {
        name: 'identity',
        description: 'Returns its arg',
      }
    );

    app.tool(
      async (params: { arg: string }) => {
        return params.arg;
      },
      {
        name: 'identity',
        description: 'Returns its arg',
      }
    );

    app.tool(
      async (_params) => {
        throw new Error();
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
      async (_params, options) => {
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

  it('can be invoked using the decorator pattern', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    class Lambda {
      @app.tool({ name: 'hello', description: 'Says hello' })
      async helloWorld() {
        return 'Hello, world!';
      }

      @app.tool({ name: 'add', description: 'Adds two numbers' })
      async add(params: { a: number; b: number }) {
        const { a, b } = params;
        return a + b;
      }

      public async handler(event: BedrockAgentFunctionEvent, context: Context) {
        return app.resolve(event, context);
      }
    }

    const lambda = new Lambda();

    const addEvent = createEvent('add', [
      {
        name: 'a',
        type: 'number',
        value: '1',
      },
      {
        name: 'b',
        type: 'number',
        value: '2',
      },
    ]);

    // Act
    const actual = await lambda.handler(addEvent, context);

    // Assess
    expect(actual.response.function).toEqual('add');
    expect(actual.response.functionResponse.responseBody.TEXT.body).toEqual(
      '3'
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

  it('handles functions that throw errors', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(
      async (_params, _options) => {
        throw new Error('Something went wrong');
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
      'Error when invoking tool: Error: Something went wrong'
    );
    expect(console.error).toHaveBeenCalledWith(
      'An error occurred in tool error-tool.',
      new Error('Something went wrong')
    );
  });

  it('returns a fully structured BedrockAgentFunctionResponse', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(
      async (params, _options) => {
        return `Hello, ${params.name}!`;
      },
      {
        name: 'greeting',
        description: 'Greets a person by name',
      }
    );

    const customSessionAttrs = {
      sessionAttr: '12345',
    };

    const customPromptAttrs = {
      promptAttr: 'promptAttr',
    };

    const customEvent = {
      ...createEvent('greeting', [
        {
          name: 'name',
          type: 'string',
          value: 'John',
        },
      ]),
      actionGroup: 'actionGroup',
      sessionAttributes: customSessionAttrs,
      promptSessionAttributes: customPromptAttrs,
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
      sessionAttributes: customSessionAttrs,
      promptSessionAttributes: customPromptAttrs,
    });
  });
});
