export class FunctionSegmentNotDefinedError extends Error {
  public constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, FunctionSegmentNotDefinedError.prototype);
  }
}
