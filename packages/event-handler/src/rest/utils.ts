import type { CompiledRoute, Path, ValidationResult } from '../types/rest.js';
import { PARAM_PATTERN, SAFE_CHARS, UNSAFE_CHARS } from './constants.js';
import type { Route } from './Route.js';

export function compilePath(path: Path): CompiledRoute {
  const paramNames: string[] = [];

  const regexPattern = path.replace(PARAM_PATTERN, (_match, paramName) => {
    paramNames.push(paramName);
    return `(?<${paramName}>[${SAFE_CHARS}${UNSAFE_CHARS}\\w]+)`;
  });

  const finalPattern = `^${regexPattern}$`;

  return {
    path,
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

type ProcessedParams = {
  raw: Record<string, string>;
  processed: Record<string, any>;
  route: Route;
};

export function processParams(
  params: Record<string, string>
): Record<string, any> {
  const processed: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    processed[key] = decodeURIComponent(value);
  }

  return processed;
}

export function validateParams(
  params: Record<string, string>
): ValidationResult {
  const issues: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (!value || value.trim() === '') {
      issues.push(`Parameter '${key}' cannot be empty`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
