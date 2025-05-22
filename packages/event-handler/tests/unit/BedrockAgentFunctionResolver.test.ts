import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BedrockAgentFunctionEvent, Parameter } from '../../src/types';
import { BedrockAgentFunctionResolver } from '../../src/bedrock-agent-function';

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

    app.tool(async (params) => {
      return Number(params.a) + Number(params);
    }, {
      name: 'mult',
      definition: 'Multiplies two numbers',
    });

    expect(console.warn).toHaveBeenLastCalledWith(
      'The maximum number of tools that can be registered is 5. Tool mult will not be registered.'
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

    const actual = await app.resolve(event, context);

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

    app.tool(
      async (params) => {
        return Number(params.a) / Number(params.b);
      },
      {
        name: 'math',
        definition: 'Divides two numbers',
      }
    );

    const divideResult = await app.resolve(event, context);
    expect(divideResult.response.function).toEqual('math');
    expect(
      divideResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('5');

    expect(console.warn).toHaveBeenCalledTimes(3);
    expect(console.warn).toHaveBeenCalledWith(
      'Tool math already registered. Overwriting with new definition.'
    );
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

    const helloEvent = createEvent('hello');

    const helloResult = await lambda.handler(helloEvent, context);
    expect(helloResult.response.function).toEqual('hello');
    expect(
      helloResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('Hello, world!');

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

    const addResult = await lambda.handler(addEvent, context);
    expect(addResult.response.function).toEqual('add');
    expect(addResult.response.functionResponse.responseBody.TEXT.body).toEqual(
      '3'
    );
  });

  it('handles functions that return different primitive types', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(async () => 'Hello, world!', {
      name: 'string-tool',
      definition: 'Returns a string',
    });

    app.tool(async () => 42, {
      name: 'number-tool',
      definition: 'Returns a number',
    });

    app.tool(async () => true, {
      name: 'boolean-tool',
      definition: 'Returns a boolean',
    });

    const stringResult = await app.resolve(createEvent('string-tool'), context);
    expect(stringResult.response.function).toEqual('string-tool');
    expect(
      stringResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('Hello, world!');

    const numberResult = await app.resolve(createEvent('number-tool'), context);
    expect(numberResult.response.function).toEqual('number-tool');
    expect(
      numberResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('42');

    const booleanResult = await app.resolve(
      createEvent('boolean-tool'),
      context
    );
    expect(booleanResult.response.function).toEqual('boolean-tool');
    expect(
      booleanResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('true');
  });

  it('handles functions that return complex types (array and object)', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(async () => [1, 'two', false, null], {
      name: 'array-tool',
      definition: 'Returns an array',
    });

    app.tool(
      async () => ({
        name: 'John Doe',
        age: 30,
        isActive: true,
        address: {
          street: '123 Main St',
          city: 'Anytown',
        },
      }),
      {
        name: 'object-tool',
        definition: 'Returns an object',
      }
    );

    const arrayResult = await app.resolve(createEvent('array-tool'), context);
    expect(arrayResult.response.function).toEqual('array-tool');
    expect(
      arrayResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('[1,"two",false,null]');

    const objectResult = await app.resolve(createEvent('object-tool'), context);
    expect(objectResult.response.function).toEqual('object-tool');
    expect(
      objectResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual(
      '{"name":"John Doe","age":30,"isActive":true,"address":{"street":"123 Main St","city":"Anytown"}}'
    );
  });

  it('handles functions that return null or undefined by returning a string', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    app.tool(async () => null, {
      name: 'null-tool',
      definition: 'Returns null',
    });

    app.tool(async () => undefined, {
      name: 'undefined-tool',
      definition: 'Returns undefined',
    });

    app.tool(async () => {}, {
      name: 'no-return-tool',
      definition: 'Has no return statement',
    });

    const nullResult = await app.resolve(createEvent('null-tool'), context);
    expect(nullResult.response.function).toEqual('null-tool');
    expect(nullResult.response.functionResponse.responseBody.TEXT.body).toEqual(
      ''
    );

    const undefinedResult = await app.resolve(
      createEvent('undefined-tool'),
      context
    );
    expect(undefinedResult.response.function).toEqual('undefined-tool');
    expect(
      undefinedResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('');

    const noReturnResult = await app.resolve(
      createEvent('no-return-tool'),
      context
    );
    expect(noReturnResult.response.function).toEqual('no-return-tool');
    expect(
      noReturnResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('');
  });

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

    const errorResult = await app.resolve(
      createEvent('error-tool', []),
      context
    );
    expect(errorResult.response.function).toEqual('error-tool');
    expect(
      errorResult.response.functionResponse.responseBody.TEXT.body
    ).toEqual('Error when invoking tool: Error: Something went wrong');
    expect(console.error).toHaveBeenCalledWith(
      'An error occurred in tool error-tool.',
      new Error('Something went wrong')
    );
  });

  it('returns a fully structured BedrockAgentFunctionResponse', async () => {
    // Prepare
    const app = new BedrockAgentFunctionResolver();

    // Register a tool that returns a simple value
    app.tool(
      async (params) => {
        return `Hello, ${params.name}!`;
      },
      {
        name: 'greeting',
        definition: 'Greets a person by name',
      }
    );

    // Define custom session attributes and parameters
    const customSessionAttrs = {
      sessionAttr: '12345',
    };

    const customPromptAttrs = {
      promptAttr: 'promptAttr',
    };

    // Create a custom event with session attributes
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

    const result = await app.resolve(customEvent, context);

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
