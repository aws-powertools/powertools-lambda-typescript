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

export const PARAM_PATTERN = /:([a-zA-Z_]\w*)(?=\/|$)/g;

export const SAFE_CHARS = "-._~()'!*:@,;=+&$";

export const UNSAFE_CHARS = '%<> \\[\\]{}|^';
