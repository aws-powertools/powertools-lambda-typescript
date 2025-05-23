import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BedrockAgentFunctionResolver } from '../../../src/bedrock-agent-function/index.js';
import type { BedrockAgentFunctionEvent, Parameter } from '../../../src/types';

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
    parameters,
    actionGroup: 'myActionGroup',
    sessionAttributes: {},
    promptSessionAttributes: {},
  };
}

describe('Class: BedrockAgentFunctionResolver', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses a default logger with only warnings if none is provided', () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(async (_params) => {}, {
      name: 'noop',
      definition: 'Does nothing',
    });

    // Assess
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('emits debug message when AWS_LAMBDA_LOG_LEVEL is set to DEBUG', () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');
    const app = new BedrockAgentFunctionResolver();

    app.tool(async (_params) => {}, {
      name: 'noop',
      definition: 'Does nothing',
    });

    // Assess
    expect(console.debug).toHaveBeenCalled();
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

    app.tool(async (_params) => {}, {
      name: 'noop',
      definition: 'Does nothing',
    });

    // Act

    await app.resolve(createEvent('noop', []), context);

    // Assess
    expect(logger.debug).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalled();
  });

  it('only allows five tools to be registered', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    for (const num of [1, 2, 3, 4, 5]) {
      app.tool(async (_params) => {}, {
        name: `noop${num}`,
        definition: 'Does nothing',
      });
    }

    app.tool(
      async (params) => {
        return Number(params.a) + Number(params);
      },
      {
        name: 'mult',
        definition: 'Multiplies two numbers',
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
      async (params) => {
        return Number(params.a) + Number(params.b);
      },
      {
        name: 'math',
        definition: 'Adds two numbers',
      }
    );

    const addResult = await app.resolve(event, context);
    expect(addResult.response.function).toEqual('math');
    expect(addResult.response.functionResponse.responseBody.TEXT.body).toEqual(
      '12'
    );

    app.tool(
      async (params) => {
        return Number(params.a) * Number(params.b);
      },
      {
        name: 'math',
        definition: 'Multiplies two numbers',
      }
    );

    const multiplyResult = await app.resolve(event, context);
    expect(multiplyResult.response.function).toEqual('math');
    expect(
      multiplyResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('20');
  });

  it('can be invoked using the decorator pattern', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    class Lambda {
      @app.tool({ name: 'hello', definition: 'Says hello' })
      async helloWorld() {
        return 'Hello, world!';
      }

      @app.tool({ name: 'add', definition: 'Adds two numbers' })
      async add(params: { a: string; b: string }) {
        const { a, b } = params;
        return Number.parseInt(a) + Number.parseInt(b);
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
      toolFunction: async () => 'Hello, world',
      toolParams: {
        name: 'string',
        definition: 'Returns string',
      },
      expected: 'Hello, world',
    },
    {
      toolFunction: async () => 42,
      toolParams: {
        name: 'number',
        definition: 'Returns number',
      },
      expected: '42',
    },
    {
      toolFunction: async () => true,
      toolParams: {
        name: 'boolean',
        definition: 'Returns boolean',
      },
      expected: 'true',
    },
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
        definition: 'Returns an object',
      },
      expected:
        '{"name":"John Doe","age":30,"isActive":true,"address":{"street":"123 Main St","city":"Anytown"}}',
    },
    {
      toolFunction: async () => [1, 'two', false, null],
      toolParams: {
        name: 'array',
        definition: 'Returns an array',
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
        definition: 'Returns null',
      },
    },
    {
      toolFunction: async () => void 0,
      toolParams: {
        name: 'undefined',
        definition: 'Returns undefined',
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

  it('handles functions that throw errors', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(
      async () => {
        throw new Error('Something went wrong');
      },
      {
        name: 'error-tool',
        definition: 'Throws an error',
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
      async (params) => {
        return `Hello, ${params.name}!`;
      },
      {
        name: 'greeting',
        definition: 'Greets a person by name',
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
              body: 'Hello, John!',
            },
          },
        },
      },
      sessionAttributes: customSessionAttrs,
      promptSessionAttributes: customPromptAttrs,
    });
  });
});
