declare const data: Record<string, unknown>;

import { DataMasking } from '@aws-lambda-powertools/data-masking';

const masker = new DataMasking();

export const masked = masker.erase(data, {
  maskingRules: {
    email: { regexPattern: /(.)(.*)(@.*)/, maskFormat: '$1****$3' }, // j****@example.com
    ssn: { dynamicMask: true }, // mask length matches original
    zip: { customMask: 'XXXXX' }, // fixed replacement string
  },
});
