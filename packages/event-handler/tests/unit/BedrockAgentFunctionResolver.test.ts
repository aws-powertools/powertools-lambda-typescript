import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BedrockAgentFunctionResolver } from '../../src/bedrockAgentFunction/BedrockAgentFunctionResolver.js';
import context from '@aws-lambda-powertools/testing-utils/context';

const baseBedrockAgentFunctionRequest = {
  messageVersion: '1.0',
  agent: {
    name: '',
    id: 'string',
    alias: 'string',
    version: 'string',
  },
  inputText: 'string',
  sessionId: 'string',
  actionGroup: 'string',
  function: 'string',
  parameters: [],
  sessionAttributes: {},
  promptSessionAttributes: {},
};

describe('BedrockAgentFunctionResolver', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  class WrappedResolver extends BedrockAgentFunctionResolver {
    public getRegistry() {
      return this.registry;
    }
  }

  it('registers tools', () => {
    // Arrange
    const resolver = new WrappedResolver();
    // Act
    resolver.tool(() => {}, {
      name: 'noop',
      definition: 'Does nothing',
      validation: { input: {}, output: {} },
      requireConfirmation: false,
    });

    // Assess
    expect(resolver.getRegistry().get('noop')).toEqual(
      expect.objectContaining({
        config: {
          name: 'noop',
          requireConfirmation: false,
          definition: 'Does nothing',
          validation: { input: {}, output: {} },
        },
        function: expect.any(Function),
      })
    );
  });

  it('resolves events to the correct tool', () => {
    // Arrange
    const resolver = new WrappedResolver();
    const noop = vi.fn();

    resolver.tool(noop, {
      name: 'noop',
      definition: 'Does nothing',
      validation: { input: {}, output: {} },
      requireConfirmation: false,
    });

    // Act
    resolver.resolve(
      { ...baseBedrockAgentFunctionRequest, function: 'noop' },
      context
    );

    expect(noop).toBeCalled();
  });

  it('responds with the correct response structure when a tool is successfully invoked', () => {
    const resolver = new WrappedResolver();
    const uppercaser = ({ str }): string => str.toUpperCase();

    resolver.tool(uppercaser, {
      name: 'uppercaser',
      definition: 'Converts a string to uppercase',
      validation: { input: {}, output: {} },
      requireConfirmation: false,
    });

    // Act
    const response = resolver.resolve(
      {
        ...baseBedrockAgentFunctionRequest,
        function: 'uppercaser',
        parameters: [{ name: 'str', value: 'hello world', type: 'string' }],
      },
      context
    );

    expect(response).toEqual(
      expect.objectContaining({
        messageVersion: '1.0',
        response: {
          actionGroup: baseBedrockAgentFunctionRequest.actionGroup,
          function: 'uppercaser',
          functionResponse: {
            responseBody: {
              TEXT: {
                body: 'HELLO WORLD',
              },
            },
          },
        },
      })
    );
  });
});
