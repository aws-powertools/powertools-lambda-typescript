import type { Path } from '../types/rest.js';

const PARAM_PATTERN = /:([a-zA-Z_]\w*)(?=\/|$)/g;
const SAFE_CHARS = "-._~()'!*:@,;=+&$";
const UNSAFE_CHARS = '%<> \\[\\]{}|^';

export function compilePath(path: Path): CompiledRoute {
  const paramNames: string[] = [];

  const regexPattern = path.replace(PARAM_PATTERN, (_match, paramName) => {
    paramNames.push(paramName);
    return `(?<${paramName}>[${SAFE_CHARS}${UNSAFE_CHARS}\\w]+)`;
  });

  const finalPattern = `^${regexPattern}$`;

  return {
    originalPath: path,
    regex: new RegExp(finalPattern),
    paramNames,
    isDynamic: paramNames.length > 0,
  };
}

type ValidationResult = {
  isValid: boolean;
  issues: string[];
};

export function validatePathPattern(path: Path): ValidationResult {
  const issues: string[] = [];

  const matches = [...path.matchAll(PARAM_PATTERN)];
  if (path.includes(':')) {
    const expectedParams = path.split(':').length;
    if (matches.length !== expectedParams - 1) {
      issues.push('Malformed parameter syntax. Use :paramName format.');
    }

    const paramNames = matches.map((match) => match[1]);
    const duplicates = paramNames.filter(
      (param, index) => paramNames.indexOf(param) !== index
    );
    if (duplicates.length > 0) {
      issues.push(`Duplicate parameter names: ${duplicates.join(', ')}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

interface CompiledRoute {
  originalPath: string;
  regex: RegExp;
  paramNames: string[];
  isDynamic: boolean;
}
