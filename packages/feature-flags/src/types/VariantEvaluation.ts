import type { EvaluationContext, Variant } from './index.js';

/** Supplies a full Variant fallback without a schema. */
type EvaluateVariantOptions = {
  name: string;
  context?: EvaluationContext;
  default: Variant;
  schema?: never;
};

/** Supplies a full Variant fallback per flag without schemas. */
type EvaluateManyVariantOptions<Flags> = {
  flags: Flags & Record<string, Variant>;
  context?: EvaluationContext;
  schemas?: never;
};

/** Preserves batch keys while returning full Variants rather than fallback literals. */
type EvaluateManyVariantResult<Flags> = {
  [Name in keyof Flags]: Variant;
};

export type {
  EvaluateManyVariantOptions,
  EvaluateManyVariantResult,
  EvaluateVariantOptions,
};
