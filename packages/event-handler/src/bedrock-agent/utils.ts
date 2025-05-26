import { isRecord, isString } from '@aws-lambda-powertools/commons/typeutils';
import type { BedrockAgentFunctionEvent } from '../types/bedrock-agent.js';

/**
 * Asserts that the provided event is a BedrockAgentFunctionEvent.
 *
 * @param event - The incoming event to check
 * @throws Error if the event is not a valid BedrockAgentFunctionEvent
 */
export function assertBedrockAgentFunctionEvent(
  event: unknown
): asserts event is BedrockAgentFunctionEvent {
  const isValid =
    isRecord(event) &&
    'actionGroup' in event &&
    isString(event.actionGroup) &&
    'function' in event &&
    isString(event.function) &&
    (!('parameters' in event) ||
      (Array.isArray(event.parameters) &&
        event.parameters.every(
          (param) =>
            isRecord(param) &&
            'name' in param &&
            isString(param.name) &&
            'type' in param &&
            isString(param.type) &&
            'value' in param &&
            isString(param.value)
        ))) &&
    'messageVersion' in event &&
    isString(event.messageVersion) &&
    'agent' in event &&
    isRecord(event.agent) &&
    'name' in event.agent &&
    isString(event.agent.name) &&
    'id' in event.agent &&
    isString(event.agent.id) &&
    'alias' in event.agent &&
    isString(event.agent.alias) &&
    'version' in event.agent &&
    isString(event.agent.version) &&
    'inputText' in event &&
    isString(event.inputText) &&
    'sessionId' in event &&
    isString(event.sessionId) &&
    'sessionAttributes' in event &&
    isRecord(event.sessionAttributes) &&
    'promptSessionAttributes' in event &&
    isRecord(event.promptSessionAttributes);

  if (!isValid) {
    throw new Error('Event is not a valid BedrockAgentFunctionEvent');
  }
}
