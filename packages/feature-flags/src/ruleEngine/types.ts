import type {
  GenericLogger,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import type { RuleActions } from '../constants.js';

/** Configures retrieval and optional logging for a local rule engine Store. */
type RuleEngineStoreOptions = {
  /** Retrieves a Python-format Flag Document for each Store call. */
  source: () => Promise<JSONValue>;
  /** Logs validation warnings and evaluation outcomes without values. */
  logger?: GenericLogger;
  /** Supplies the clock for schedule Actions, ignoring caller context. Defaults to () => new Date(). */
  now?: () => Date;
};

/** Identifies a supported Action. @internal */
type RuleAction = (typeof RuleActions)[keyof typeof RuleActions];

/** Compares a context operand with a document operand. @internal */
type Comparator = (context: unknown, value: JSONValue) => boolean;

/** Carries a validated Action and its operands' key and value. @internal */
type Condition = { action: RuleAction; key: string; value: JSONValue };

/** Carries a validated result and its AND-connected Conditions. @internal */
type Rule = { when_match: JSONValue; conditions: Condition[] };

/** Carries a validated Flag Default and ordered named Rules. @internal */
type Flag = { default: JSONValue; rules: Record<string, Rule> };

/** Maps flag names to validated flag definitions. @internal */
type FlagDocument = Record<string, Flag>;

export type {
  Comparator,
  Condition,
  Flag,
  FlagDocument,
  Rule,
  RuleAction,
  RuleEngineStoreOptions,
};
