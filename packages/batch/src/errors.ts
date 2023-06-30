class BaseBatchProcessingError extends Error {
  public childExceptions: Error[];

  public msg: string;

  public constructor(msg: string, childExceptions: Error[]) {
    super();
    this.msg = msg;
    this.childExceptions = childExceptions;
  }
}

class BatchProcessingError extends BaseBatchProcessingError {
  public constructor(msg: string, childExceptions: Error[]) {
    super(msg, childExceptions);
  }
}

export { BaseBatchProcessingError, BatchProcessingError };
