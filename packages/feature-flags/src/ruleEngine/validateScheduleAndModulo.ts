import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { RuleActions, TimeActionKeys } from '../constants.js';
import { SchemaValidationError } from '../errors.js';
import type { RuleAction } from '../types/RuleEngine.js';
import {
  getDatetimeRangeError,
  getDaysOfWeekError,
  getModuloRangeError,
  getTimeRangeError,
  isDatetimeRange,
  isDaysOfWeek,
  isModuloRange,
  isTimeRange,
} from './guards.js';
import { isTimeAction } from './time.js';

/**
 * Validates schedule keys, time/day bounds, zones, and modulo integer bounds.
 * @param action - Supply the validated Action name
 * @param key - Supply the context or clock key
 * @param value - Supply the JSON document operand
 * @param location - Identify the Condition without operand values
 * @internal
 */
const validateScheduleAndModulo = (
  action: RuleAction,
  key: string,
  value: JSONValue,
  location: string
): void => {
  if (action === RuleActions.MODULO_RANGE) {
    if (!isModuloRange(value))
      throw new SchemaValidationError(
        `${location} ${getModuloRangeError(value)}`
      );
    return;
  }
  if (!isTimeAction(action)) return;
  if (key !== TimeActionKeys[action])
    throw new SchemaValidationError(
      `${location} key must be ${TimeActionKeys[action]}`
    );
  if (action === RuleActions.SCHEDULE_BETWEEN_DAYS_OF_WEEK) {
    if (!isDaysOfWeek(value))
      throw new SchemaValidationError(
        `${location} ${getDaysOfWeekError(value)}`
      );
  } else if (action === RuleActions.SCHEDULE_BETWEEN_TIME_RANGE) {
    if (!isTimeRange(value))
      throw new SchemaValidationError(
        `${location} ${getTimeRangeError(value)}`
      );
  } else if (!isDatetimeRange(value)) {
    throw new SchemaValidationError(
      `${location} ${getDatetimeRangeError(value)}`
    );
  }
};

export { validateScheduleAndModulo };
