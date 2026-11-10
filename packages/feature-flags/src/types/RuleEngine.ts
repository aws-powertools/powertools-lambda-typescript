import type { FlagDocument } from '../ruleEngine/types.js';

/** Holds the last validated document and its serialized source content. @internal */
type RuleEngineSnapshot = { key: string; document: FlagDocument };

/** Validates a retrieved document and returns compiled flag definitions. @internal */
type DocumentValidator = (document: unknown) => FlagDocument;

export type { DocumentValidator, RuleEngineSnapshot };
