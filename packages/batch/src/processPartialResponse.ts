import {
  BasePartialBatchProcessor,
  BaseRecord,
  PartialItemFailureResponse,
} from '.';

const processPartialResponse = async (
  event: { Records: BaseRecord[] },
  recordHandler: CallableFunction,
  processor: BasePartialBatchProcessor
): Promise<PartialItemFailureResponse> => {
  const records: BaseRecord[] = event['Records'];

  processor.register(records, recordHandler);
  await processor.process();

  return processor.response();
};

export { processPartialResponse };
