import { isTruthy } from '@aws-lambda-powertools/commons';
import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import { StoreNames } from '../constants.js';
import { ConditionEvaluationError } from '../errors.js';
import type { EvaluationContext, StoreResult } from '../types/index.js';
import type { Condition, Flag } from '../types/RuleEngine.js';
import { actions } from './actions.js';
import { cloneJSONValue } from './json.js';

/**
 * Evaluates one flag using its first fully matching Rule or its Flag Default.
 * @param name - Identify the flag
 * @param flag - Supply the validated flag definition
 * @param context - Supply caller facts for evaluation
 * @param logger - Log the selected Rule or Flag Default without values
 * @internal
 */
const evaluate = (
  name: string,
  flag: Flag,
  context: EvaluationContext,
  logger?: GenericLogger
): StoreResult => {
  for (const [rule, definition] of Object.entries(flag.rules)) {
    if (
      definition.conditions.every((condition) =>
        matches(name, rule, condition, context)
      )
    ) {
      const value = cloneJSONValue(definition.when_match);
      logger?.debug({
        store: StoreNames.RULE_ENGINE,
        name,
        outcome: 'rule',
        rule,
      });
      return { found: true, value, enabled: isTruthy(value) };
    }
  }
  const value = cloneJSONValue(flag.default);
  logger?.debug({ store: StoreNames.RULE_ENGINE, name, outcome: 'default' });
  return { found: true, value, enabled: isTruthy(value) };
};

/**
 * Applies a Condition only when the context owns its key.
 * @param name - Identify the flag
 * @param rule - Identify the Rule
 * @param condition - Supply the validated Condition
 * @param context - Supply caller facts for evaluation
 * @internal
 */
const matches = (
  name: string,
  rule: string,
  condition: Condition,
  context: EvaluationContext
): boolean => {
  const { key, action, value } = condition;
  if (!Object.hasOwn(context, key)) return false;
  try {
    return actions[action](context[key], value);
  } catch {
    throw new ConditionEvaluationError(
      `Flag '${name}', rule '${rule}', key '${key}', action '${action}': incompatible operands`
    );
  }
};

export { evaluate };
