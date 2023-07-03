import {
  BasePartialBatchProcessor,
  BaseRecord,
  FailureResponse,
  SuccessResponse,
} from '.';

class BatchProcessor extends BasePartialBatchProcessor {
  public async processRecord(
    record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    try {
      const data = this.toBatchType(record, this.eventType);
      let result;
      if (this.lambdaContext) {
        result = await this.handler(data, this.lambdaContext);
      } else {
        result = await this.handler(data);
      }

      return this.successHandler(record, result);
    } catch (e) {
      return this.failureHandler(record, e as Error);
    }
  }
}

export { BatchProcessor };
