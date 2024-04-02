import { extractDataFromEnvelope } from '@aws-lambda-powertools/jmespath/envelopes';

type MyEvent = {
  body: string; // "{\"customerId\":\"dd4649e6-2484-4993-acb8-0f9123103394\"}"
  deeplyNested: Array<{ someData: number[] }>;
};

type MessageBody = {
  customerId: string;
};

export const handler = async (event: MyEvent): Promise<unknown> => {
  const payload = extractDataFromEnvelope<MessageBody>(
    event,
    'powertools_json(body)'
  );
  const { customerId } = payload; // now deserialized

  // also works for fetching and flattening deeply nested data
  const someData = extractDataFromEnvelope<number[]>(
    event,
    'deeplyNested[*].someData[]'
  );

  return {
    customerId,
    message: 'success',
    context: someData,
    statusCode: 200,
  };
};
