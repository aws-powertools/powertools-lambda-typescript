import {
  BasePartialBatchProcessor,
  BaseRecord,
  EventType,
  PartialItemFailureResponse,
} from '.';

const processPartialResponse = async (
  event: { Records: BaseRecord[] },
  recordHandler: CallableFunction,
  processor: BasePartialBatchProcessor
): Promise<PartialItemFailureResponse> => {
  if (!event.Records) {
    const eventTypes: string = Object.values(EventType).toString();
    throw new Error(
      'Failed to convert event to record batch for processing.\nPlease ensure batch event is a valid ' +
        eventTypes +
        ' event.'
    );
  }

  const records = event['Records'];

  processor.register(records, recordHandler);
  await processor.process();

  return processor.response();
};

export { processPartialResponse };
