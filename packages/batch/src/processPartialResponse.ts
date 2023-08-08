import { BasePartialBatchProcessor } from './BasePartialBatchProcessor';
import { UnexpectedBatchTypeError } from './errors';
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
const processPartialResponse = (
  event: { Records: BaseRecord[] },
  recordHandler: CallableFunction,
  processor: BasePartialBatchProcessor,
  options?: BatchProcessingOptions
): PartialItemFailureResponse => {
  if (!event.Records || !Array.isArray(event.Records)) {
    throw new UnexpectedBatchTypeError();
  }

  processor.register(event.Records, recordHandler, options);

  processor.process();

  return processor.response();
};

export { processPartialResponse };
