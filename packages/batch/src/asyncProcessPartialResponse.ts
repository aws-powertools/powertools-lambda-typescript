import { BasePartialBatchProcessor } from './BasePartialBatchProcessor';
import { EventType } from './constants';
import type {
  BaseRecord,
  BatchProcessingOptions,
  PartialItemFailureResponse,
} from './types';

/**
 * Higher level function to handle batch event processing
 * @param event Lambda's original event
 * @param recordHandler Callable function to process each record from the batch
 * @param processor Batch processor to handle partial failure cases
 * @returns Lambda Partial Batch Response
 */
const asyncProcessPartialResponse = async (
  event: { Records: BaseRecord[] },
  recordHandler: CallableFunction,
  processor: BasePartialBatchProcessor,
  options?: BatchProcessingOptions
): Promise<PartialItemFailureResponse> => {
  if (!event.Records) {
    const eventTypes: string = Object.values(EventType).toString();
    throw new Error(
      'Failed to convert event to record batch for processing.\nPlease ensure batch event is a valid ' +
        eventTypes +
        ' event.'
    );
  }

  processor.register(event.Records, recordHandler, options);

  await processor.asyncProcess();

  return processor.response();
};

export { asyncProcessPartialResponse };
