class IdempotencyItemNotFoundError extends Error {

}

class IdempotencyItemAlreadyExistsError extends Error{

}

class IdempotencyInvalidStatusError extends Error {

}

class IdempotencyInconsistentStateError extends Error {

}

class IdempotencyAlreadyInProgressError extends Error {

}

export {
  IdempotencyItemNotFoundError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyInvalidStatusError,
  IdempotencyInconsistentStateError,
  IdempotencyAlreadyInProgressError
};