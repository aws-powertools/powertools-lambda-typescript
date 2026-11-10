import {
  isNull,
  isNumber,
  isRecord,
  isString,
} from '@aws-lambda-powertools/commons';
import type {
  GenericLogger,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import { FlagDocumentFields, RuleActions } from '../constants.js';
import { SchemaValidationError } from '../errors.js';
import type {
  Condition,
  Flag,
  FlagDocument,
  Rule,
  RuleAction,
} from './types.js';
import { validateScheduleAndModulo } from './validateScheduleAndModulo.js';

/**
 * Validates an entire Python-format Flag Document and returns typed definitions.
 * @param document - Supply the retrieved document
 * @param logger - Log accepted empty documents and empty Rules without values
 * @internal
 */
const validate = (document: unknown, logger?: GenericLogger): FlagDocument => {
  if (!isRecord(document))
    throw new SchemaValidationError('Flag Document must be an object');
  const entries: [string, Flag][] = [];
  for (const [name, flag] of Object.entries(document)) {
    const location = `Flag '${name}'`;
    if (!isRecord(flag) || !Object.hasOwn(flag, FlagDocumentFields.DEFAULT)) {
      throw new SchemaValidationError(
        `${location} must be an object with a default`
      );
    }
    const booleanType = Object.hasOwn(flag, FlagDocumentFields.BOOLEAN_TYPE)
      ? flag[FlagDocumentFields.BOOLEAN_TYPE]
      : true;
    if (typeof booleanType !== 'boolean')
      throw new SchemaValidationError(
        `${location} boolean_type must be a boolean`
      );
    const defaultValue = validateResult(
      flag[FlagDocumentFields.DEFAULT],
      booleanType,
      `${location} default`
    );
    const rules = Object.hasOwn(flag, FlagDocumentFields.RULES)
      ? validateRules(flag[FlagDocumentFields.RULES], name, booleanType, logger)
      : {};
    entries.push([name, { default: defaultValue, rules }]);
  }
  if (entries.length === 0)
    logger?.warn({ store: 'rule-engine', reason: 'empty-document' });
  return Object.fromEntries(entries);
};

/**
 * Validates named Rules without changing their insertion order.
 * @param rules - Supply the Rules object
 * @param name - Identify the flag
 * @param booleanType - Require boolean results for boolean flags
 * @param logger - Log accepted empty Rules without values
 * @internal
 */
const validateRules = (
  rules: unknown,
  name: string,
  booleanType: boolean,
  logger?: GenericLogger
): Record<string, Rule> => {
  if (!isRecord(rules))
    throw new SchemaValidationError(`Flag '${name}' rules must be an object`);
  const entries: [string, Rule][] = [];
  for (const [ruleName, rule] of Object.entries(rules)) {
    const location = `Flag '${name}', rule '${ruleName}'`;
    if (
      ruleName.length === 0 ||
      (/^(0|[1-9]\d*)$/.test(ruleName) && Number(ruleName) < 2 ** 32 - 1)
    ) {
      throw new SchemaValidationError(
        `${location} must use a non-empty name that preserves insertion order`
      );
    }
    if (
      !isRecord(rule) ||
      !Object.hasOwn(rule, FlagDocumentFields.WHEN_MATCH)
    ) {
      throw new SchemaValidationError(
        `${location} must be an object with when_match`
      );
    }
    const whenMatch = validateResult(
      rule[FlagDocumentFields.WHEN_MATCH],
      booleanType,
      `${location} when_match`
    );
    const conditions = rule[FlagDocumentFields.CONDITIONS];
    if (!Array.isArray(conditions) || conditions.length === 0) {
      throw new SchemaValidationError(
        `${location} conditions must be a non-empty array`
      );
    }
    const validatedConditions: Condition[] = [];
    for (const [index, condition] of conditions.entries())
      validatedConditions.push(
        validateCondition(condition, `${location}, condition ${index}`)
      );
    entries.push([
      ruleName,
      { when_match: whenMatch, conditions: validatedConditions },
    ]);
  }
  if (entries.length === 0)
    logger?.warn({ store: 'rule-engine', reason: 'empty-rules', name });
  return Object.fromEntries(entries);
};

/**
 * Validates a Condition and identifies failures without including operand values.
 * @param condition - Supply the Condition object
 * @param location - Identify its flag, Rule, and zero-based Condition index
 * @internal
 */
const validateCondition = (condition: unknown, location: string): Condition => {
  if (!isRecord(condition))
    throw new SchemaValidationError(`${location} must be an object`);
  const action = condition[FlagDocumentFields.ACTION];
  const key = condition[FlagDocumentFields.KEY];
  const identifier = `${location}, key '${isString(key) ? key : '<invalid>'}', action '${isString(action) ? action : '<invalid>'}'`;
  if (!isString(action))
    throw new SchemaValidationError(`${identifier} action must be a string`);
  if (!isRuleAction(action))
    throw new SchemaValidationError(`${identifier} action is unknown`);
  if (!isString(key) || key.length === 0)
    throw new SchemaValidationError(
      `${identifier} key must be a non-empty string`
    );
  const value = condition[FlagDocumentFields.VALUE];
  if (
    !Object.hasOwn(condition, FlagDocumentFields.VALUE) ||
    !isJSONValue(value)
  ) {
    throw new SchemaValidationError(
      `${identifier} value must be present and contain JSON`
    );
  }
  if (
    (action === RuleActions.ALL_IN_VALUE ||
      action === RuleActions.ANY_IN_VALUE ||
      action === RuleActions.NONE_IN_VALUE) &&
    !Array.isArray(value)
  ) {
    throw new SchemaValidationError(`${identifier} value must be an array`);
  }
  validateScheduleAndModulo(action, key, value, identifier);
  return { action, key, value };
};

/**
 * Checks whether an Action belongs to the supported vocabulary.
 * @param action - Supply the Action name
 * @internal
 */
const isRuleAction = (action: string): action is RuleAction =>
  Object.hasOwn(RuleActions, action);

/**
 * Validates a Flag Default or Rule result.
 * @param value - Supply the result value
 * @param booleanType - Require a boolean for boolean flags
 * @param location - Identify the flag, Rule, and field without values
 * @internal
 */
const validateResult = (
  value: unknown,
  booleanType: boolean,
  location: string
): JSONValue => {
  if (booleanType && typeof value !== 'boolean')
    throw new SchemaValidationError(`${location} must be a boolean`);
  if (!isJSONValue(value))
    throw new SchemaValidationError(`${location} must contain JSON`);
  return value;
};

/**
 * Checks JSON values at the source boundary, including callers that bypass types.
 * @param value - Supply the value to check
 * @param ancestors - Track containers to reject cycles without rejecting shared values
 * @internal
 */
const isJSONValue = (
  value: unknown,
  ancestors = new Set<unknown>()
): value is JSONValue => {
  if (isNull(value) || isString(value) || typeof value === 'boolean')
    return true;
  if (isNumber(value)) return Number.isFinite(value);
  if (!Array.isArray(value) && !isRecord(value)) return false;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  const entries = Array.isArray(value)
    ? Array.from(value)
    : Object.values(value);
  const valid = entries.every((entry) => isJSONValue(entry, ancestors));
  ancestors.delete(value);
  return valid;
};

export { validate };
