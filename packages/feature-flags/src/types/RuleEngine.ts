import type { FlagDocument } from '../ruleEngine/types.js';

/** Holds the last validated document and its serialized source content. @internal */
type RuleEngineSnapshot = { key: string; document: FlagDocument };

export type { RuleEngineSnapshot };
