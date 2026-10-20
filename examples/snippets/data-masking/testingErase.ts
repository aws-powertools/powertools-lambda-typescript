import { DataMasking } from '@aws-lambda-powertools/data-masking';
import { expect, it } from 'vitest';

const masker = new DataMasking();

it('masks sensitive fields', () => {
  const result = masker.erase(
    { name: 'Jane', ssn: '123-45-6789' },
    { fields: ['ssn'] }
  );

  expect(result.ssn).toBe('*****');
  expect(result.name).toBe('Jane');
});
