export const HttpVerbs = {
  CONNECT: 'CONNECT',
  TRACE: 'TRACE',
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
} as const;

export const HttpErrorCodes = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408,
  REQUEST_ENTITY_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const PARAM_PATTERN = /:([a-zA-Z_]\w*)(?=\/|$)/g;

export const SAFE_CHARS = "-._~()'!*:@,;=+&$";

export const UNSAFE_CHARS = '%<> \\[\\]{}|^';
