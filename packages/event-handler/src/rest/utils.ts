import { isRecord, isString } from '@aws-lambda-powertools/commons/typeutils';
import type { APIGatewayProxyEvent } from 'aws-lambda';
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

/**
 * Type guard to check if the provided event is an API Gateway Proxy event.
 *
 * We use this function to ensure that the event is an object and has the
 * required properties without adding a dependency.
 *
 * @param event - The incoming event to check
 */
export const isAPIGatewayProxyEvent = (
  event: unknown
): event is APIGatewayProxyEvent => {
  if (!isRecord(event)) return false;
  return (
    isString(event.httpMethod) &&
    isString(event.path) &&
    isString(event.resource) &&
    isRecord(event.headers) &&
    isRecord(event.requestContext) &&
    typeof event.isBase64Encoded === 'boolean' &&
    (event.body === null || isString(event.body))
  );
};
