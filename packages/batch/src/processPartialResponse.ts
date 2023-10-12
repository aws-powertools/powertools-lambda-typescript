import { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import { UnexpectedBatchTypeError } from './errors.js';
import type {
  BaseRecord,
  BatchProcessingOptions,
  PartialItemFailureResponse,
} from './types.js';

/**
 * Higher level function to handle batch event processing
 * @param event Lambda's original event
 * @param recordHandler Callable function to process each record from the batch
 * @param processor Batch processor to handle partial failure cases
 * @param options Batch processing options
 * @returns Lambda Partial Batch Response
 */
const processPartialResponse = async (
  event: { Records: BaseRecord[] },
  recordHandler: CallableFunction,
  processor: BasePartialBatchProcessor,
  options?: BatchProcessingOptions
): Promise<PartialItemFailureResponse> => {
  if (!event.Records || !Array.isArray(event.Records)) {
    throw new UnexpectedBatchTypeError();
  }

  processor.register(event.Records, recordHandler, options);

  await processor.process();

  return processor.response();
};

export { processPartialResponse };
