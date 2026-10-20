declare const data: Record<string, unknown>;

import { DataMasking } from '@aws-lambda-powertools/data-masking';

const masker = new DataMasking();

export const masked = masker.erase(data, {
  // top-level rule: applied to every field in `fields`...
  fields: ['ssn', 'card'],
  dynamicMask: true,
  // ...unless a per-field rule overrides it
  maskingRules: {
    card: { customMask: 'XXXX' },
  },
});

// With no `fields`, the top-level rule is applied to every leaf value instead
export const fullyMasked = masker.erase(data, { dynamicMask: true });
