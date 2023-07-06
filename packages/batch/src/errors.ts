class BaseBatchProcessingError extends Error {
  public childExceptions: Error[];

  public msg: string;

  public constructor(msg: string, childExceptions: Error[]) {
    super(msg);
    this.msg = msg;
    this.childExceptions = childExceptions;
  }

  public formatExceptions(parentExceptionString: string): string {
    let exceptionList: string[] = [parentExceptionString + "\n"];

    for (const exception of this.childExceptions) {
      exceptionList.push(exception.message);
    }

    return "\n" + exceptionList;
  }
}

class BatchProcessingError extends BaseBatchProcessingError {
  public constructor(msg: string, childExceptions: Error[]) {
    super(msg, childExceptions);
    let parentExceptionString: string = this.message;
    this.message = this.formatExceptions(parentExceptionString)
  }
}

export { BaseBatchProcessingError, BatchProcessingError };
