import { DataMasking } from '@aws-lambda-powertools/data-masking';

const masker = new DataMasking();

export const handler = async (event: { body: Record<string, unknown> }) => {
  const data = event.body;

  return masker.erase(data, {
    fields: ['email', 'address.street', 'company_address'],
  }); // (1)!
};
