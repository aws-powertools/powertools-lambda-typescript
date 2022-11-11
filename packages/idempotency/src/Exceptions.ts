class IdempotencyItemNotFoundError extends Error {

}

class IdempotencyItemAlreadyExistsError extends Error{

}

class IdempotencyInvalidStatusError extends Error {

}

export {
  IdempotencyItemNotFoundError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyInvalidStatusError
};