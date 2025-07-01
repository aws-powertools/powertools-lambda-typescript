import type {
  BedrockAgentFunctionEvent,
  ResponseState,
} from '../types/bedrock-agent.js';
import type { BedrockAgentFunctionResolver } from './BedrockAgentFunctionResolver.js';

/**
 * Class representing a response from a Bedrock agent function.
 *
 * You can use this class to customize the response sent back to the Bedrock agent with additional fields like:
 * - session attributes
 * - prompt session attributes
 * - response state (`FAILURE` or `REPROMPT`)
 *
 * When working with the {@link BedrockAgentFunctionResolver | `BedrockAgentFunctionResolver`} class, this is built automatically
 * when you return anything from your function handler other than an instance of this class.
 */
class BedrockFunctionResponse {
  /**
   * The response object that defines the response from execution of the function.
   */
  readonly body: string;
  /**
   * Optional field to indicate the whether the response is a failure or a reprompt.
   * If not provided, the default is undefined, which means no specific response state is set.
   *
   * - `FAILURE`: The agent throws a `DependencyFailedException` for the current session.
   * - `REPROMPT`: The agent passes a response string to the model to reprompt it.
   */
  readonly responseState?: ResponseState;
  /**
   * Optional field to store session attributes and their values.
   * @see {@link https://docs.aws.amazon.com/bedrock/latest/userguide/agents-session-state.html#session-state-attributes | Bedrock Agent Session State Attributes} for more details.
   */
  readonly sessionAttributes: BedrockAgentFunctionEvent['sessionAttributes'];
  /**
   * Optional field to instruct the agent to prompt attributes and their values.
   * @see {@link https://docs.aws.amazon.com/bedrock/latest/userguide/agents-session-state.html#session-state-attributes | Bedrock Agent Session State Attributes} for more details.
   */
  readonly promptSessionAttributes: BedrockAgentFunctionEvent['promptSessionAttributes'];
  /**
   * Optional field to configure knowledge bases for the agent.
   * @see {@link https://docs.aws.amazon.com/bedrock/latest/userguide/agents-session-state.html#session-state-kb | Bedrock Agent Knowledge Bases} for more details.
   */
  readonly knowledgeBasesConfiguration?: BedrockAgentFunctionEvent['knowledgeBasesConfiguration'];

  constructor({
    body,
    responseState = undefined,
    sessionAttributes = {},
    promptSessionAttributes = {},
    knowledgeBasesConfiguration = undefined,
  }: {
    body: string;
    responseState?: ResponseState;
    sessionAttributes?: BedrockAgentFunctionEvent['sessionAttributes'];
    promptSessionAttributes?: BedrockAgentFunctionEvent['promptSessionAttributes'];
    knowledgeBasesConfiguration?: BedrockAgentFunctionEvent['knowledgeBasesConfiguration'];
  }) {
    this.body = body;
    this.responseState = responseState;
    this.sessionAttributes = sessionAttributes;
    this.promptSessionAttributes = promptSessionAttributes;
    this.knowledgeBasesConfiguration = knowledgeBasesConfiguration;
  }

  /**
   * Builds the Bedrock function response object according to the Bedrock agent function {@link https://docs.aws.amazon.com/bedrock/latest/userguide/agents-lambda.html#agents-lambda-response | response format}.
   *
   * @param options - The options for building the response.
   * @param options.actionGroup - The action group of the function, this comes from the `event.actionGroup` field in the Bedrock agent function event.
   * @param options.func - The name of the function being invoked by the agent, this comes from the `event.function` field in the Bedrock agent function event.
   */
  build(options: {
    actionGroup: string;
    func: string;
  }) {
    return {
      messageVersion: '1.0',
      response: {
        actionGroup: options.actionGroup,
        function: options.func,
        functionResponse: {
          ...(this.responseState && { responseState: this.responseState }),
          responseBody: {
            TEXT: {
              body: this.body,
            },
          },
        },
      },
      ...(this.sessionAttributes && {
        sessionAttributes: this.sessionAttributes,
      }),
      ...(this.promptSessionAttributes && {
        promptSessionAttributes: this.promptSessionAttributes,
      }),
      ...(this.knowledgeBasesConfiguration && {
        knowledgeBasesConfiguration: this.knowledgeBasesConfiguration,
      }),
    };
  }
}

export { BedrockFunctionResponse };
