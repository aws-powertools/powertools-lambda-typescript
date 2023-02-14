class ServiceError extends Error {
  public constructor(protected statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

class BadRequestError extends ServiceError {
  public constructor(message: string) {
    super(400, message);
  }
}

class UnauthorizedError extends ServiceError {
  public constructor(message: string) {
    super(401, message);
  }
}

class NotFoundError extends ServiceError {
  public constructor(message: string) {
    super(404, message);
  }
}
class InternalServerError extends ServiceError {
  public constructor(message: string) {
    super(500, message);
  }
}

export {
  ServiceError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  InternalServerError,
};
