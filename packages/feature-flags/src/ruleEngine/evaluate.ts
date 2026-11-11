import { isTruthy } from '@aws-lambda-powertools/commons';
import type { GenericLogger } from '@aws-lambda-powertools/commons/types';
import { StoreNames } from '../constants.js';
import { ConditionEvaluationError } from '../errors.js';
import type { EvaluationContext, StoreResult } from '../types/index.js';
import type { Condition, Flag } from '../types/RuleEngine.js';
import { actions } from './actions.js';
import { cloneJSONValue } from './json.js';
import { currentDate, isTimeAction, timeActions } from './time.js';

/**
 * Evaluates one flag using its first fully matching Rule or its Flag Default.
 * @param name - Identify the flag
 * @param flag - Supply the validated flag definition
 * @param context - Supply caller facts for evaluation
 * @param logger - Log the selected Rule or Flag Default without values
 * @param now - Supply the clock for schedule Actions
 * @internal
 */
const evaluate = (
  name: string,
  flag: Flag,
  context: EvaluationContext,
  logger?: GenericLogger,
  now: () => Date = currentDate
): StoreResult => {
  for (const [rule, definition] of Object.entries(flag.rules)) {
    if (
      definition.conditions.every((condition) =>
        matches(name, rule, condition, context, now)
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
 * Reads the clock for schedule Conditions and own context keys for ordinary Conditions.
 * @param name - Identify the flag
 * @param rule - Identify the Rule
 * @param condition - Supply the validated Condition
 * @param context - Supply caller facts for evaluation
 * @param now - Supply the clock for schedule Actions
 * @internal
 */
const matches = (
  name: string,
  rule: string,
  condition: Condition,
  context: EvaluationContext,
  now: () => Date
): boolean => {
  const { key, action, value } = condition;
  try {
    if (isTimeAction(action)) return timeActions[action](value, now());
    if (!Object.hasOwn(context, key)) return false;
    return actions[action](context[key], value);
  } catch {
    throw new ConditionEvaluationError(
      `Flag '${name}', rule '${rule}', key '${key}', action '${action}': incompatible operands`
    );
  }
};

export { evaluate };
