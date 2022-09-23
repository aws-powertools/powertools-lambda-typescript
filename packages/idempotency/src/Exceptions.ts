class IdempotencyItemNotFoundError extends Error {

}

class IdempotencyItemAlreadyExistsError extends Error{

}

export {
  IdempotencyItemNotFoundError,
  IdempotencyItemAlreadyExistsError
};