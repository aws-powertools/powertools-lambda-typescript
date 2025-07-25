import type { CompiledRoute, Path, ValidationResult } from '../types/rest.js';
import { PARAM_PATTERN, SAFE_CHARS, UNSAFE_CHARS } from './constants.js';

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
