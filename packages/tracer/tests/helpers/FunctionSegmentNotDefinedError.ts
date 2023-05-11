/**
 * Thrown when the function segement (AWS::Lambda::Function) is not found in a trace.
 *
 * X-Ray segments are process asynchronously. They may not be available even after
 * the trace has already appeared. In that case, the function segment may be missing.
 * We will throw this error to notify caller.
 */
export class FunctionSegmentNotDefinedError extends Error {
  public constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, FunctionSegmentNotDefinedError.prototype);
  }
}
