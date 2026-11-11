import { isTruthy } from '@aws-lambda-powertools/commons';
import { StoreNames } from '../constants.js';
import { ConditionEvaluationError } from '../errors.js';
import type { StoreResult } from '../types/index.js';
import type {
  Condition,
  EvaluateFlagOptions,
  Flag,
  MatchConditionOptions,
} from '../types/RuleEngine.js';
import { actions } from './actions.js';
import { cloneJSONValue } from './json.js';
import { isTimeAction, timeActions } from './time.js';

/**
 * Evaluates one flag using its first fully matching Rule or its Flag Default.
 * @param name - Identify the flag
 * @param flag - Supply the validated flag definition
 * @param {Object} options - Configure evaluation facts, logging, and the clock
 * @param {EvaluationContext} options.context - Supply caller facts for evaluation
 * @param {GenericLogger} options.logger - Log the selected Rule or Flag Default without values
 * @param {Date} options.now - Supply the Store call's shared clock instant
 * @internal
 */
const evaluate = (
  name: string,
  flag: Flag,
  { context, logger, now }: EvaluateFlagOptions
): StoreResult => {
  for (const [rule, definition] of Object.entries(flag.rules)) {
    if (
      definition.conditions.every((condition) =>
        matches(condition, { name, rule, context, now })
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
 * Applies the shared clock instant to schedule Conditions and own context keys to ordinary Conditions.
 * @param condition - Supply the validated Condition
 * @param {Object} options - Supply identifiers, caller facts, and the clock
 * @param {string} options.name - Identify the flag
 * @param {string} options.rule - Identify the Rule
 * @param {EvaluationContext} options.context - Supply caller facts for evaluation
 * @param {Date} options.now - Supply the Store call's shared clock instant
 * @internal
 */
const matches = (
  condition: Condition,
  { name, rule, context, now }: MatchConditionOptions
): boolean => {
  const { key, action, value } = condition;
  try {
    if (isTimeAction(action)) return timeActions[action](value, now);
    if (!Object.hasOwn(context, key)) return false;
    return actions[action](context[key], value);
  } catch {
    throw new ConditionEvaluationError(
      `Flag '${name}', rule '${rule}', key '${key}', action '${action}': incompatible operands`
    );
  }
};

export { evaluate };
