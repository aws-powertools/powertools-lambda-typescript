import type {
  GenericLogger,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import type { RuleActions, TimeActionKeys } from '../constants.js';
import type { EvaluationContext } from './index.js';

/** Configures retrieval and optional logging for a local rule engine Store. */
type RuleEngineStoreOptions = {
  /** Names the Store, defaulting to `rule-engine`. */
  name?: string;
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

/** Holds the last validated document and its serialized source content. @internal */
type RuleEngineSnapshot = { key: string; document: FlagDocument };

/** Validates a retrieved document and returns compiled flag definitions. @internal */
type DocumentValidator = (document: unknown) => FlagDocument;

/** Identifies an Action that reads the clock instead of caller context. @internal */
type TimeAction = keyof typeof TimeActionKeys;

/** Carries validated bounds for a schedule Action. @internal */
type TimeRange = { START: string; END: string; TIMEZONE?: string };

/** Carries validated naive ISO bounds for a datetime schedule Action. @internal */
type DatetimeRange = { START: string; END: string; TIMEZONE?: string };

/** Carries validated day names for a schedule Action. @internal */
type DaysOfWeek = { DAYS: string[]; TIMEZONE?: string };

/** Carries validated integer bounds for a modulo Action. @internal */
type ModuloRange = { BASE: number; START: number; END: number };

/** Configures one flag evaluation without changing its identifying arguments. @internal */
type EvaluateFlagOptions = {
  context: EvaluationContext;
  logger?: GenericLogger;
  now: Date;
};

/** Supplies identifiers, caller facts, and the shared clock instant for a Condition. @internal */
type MatchConditionOptions = {
  name: string;
  rule: string;
  context: EvaluationContext;
  now: Date;
};

export type {
  Comparator,
  Condition,
  DatetimeRange,
  DaysOfWeek,
  DocumentValidator,
  EvaluateFlagOptions,
  Flag,
  FlagDocument,
  MatchConditionOptions,
  ModuloRange,
  Rule,
  RuleAction,
  RuleEngineSnapshot,
  RuleEngineStoreOptions,
  TimeAction,
  TimeRange,
};
