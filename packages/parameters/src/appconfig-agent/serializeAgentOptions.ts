import { GetParameterError } from '../errors.js';
import type { AppConfigAgentRequestOptions } from '../types/AppConfigAgent.js';

/**
 * Matches context keys that the Agent accepts without quoting.
 * @internal
 */
const contextKeyPattern = /^[A-Za-z_][A-Za-z0-9_.-]*$/;

/**
 * Matches UTF-16 code units outside printable ASCII so they can be escaped as `\uXXXX` and keep the header ASCII-only.
 * @internal
 */
const nonAsciiCodeUnitPattern = /[\u007f-\uffff]/g;

/**
 * Validates flag keys and encodes them as repeated query parameters.
 *
 * @param flags - Flag keys to retrieve in caller-provided order
 * @internal
 */
const serializeFlags = (flags: readonly string[] = []): string => {
  const parameters: string[] = [];
  for (const [index, flag] of flags.entries()) {
    if (typeof flag !== 'string' || flag.length === 0) {
      throw new GetParameterError(`Invalid flag at index ${index}`);
    }
    parameters.push(`flag=${encodeURIComponent(flag)}`);
  }
  return parameters.length === 0 ? '' : `?${parameters.join('&')}`;
};

/**
 * Validates caller context and encodes it as one ASCII-only header.
 *
 * @param context - Scalar values for multi-variant evaluation
 * @internal
 */
const serializeContext = (
  context: AppConfigAgentRequestOptions['context'] = {}
): string | undefined => {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(context)) {
    if (!contextKeyPattern.test(key)) {
      throw new GetParameterError(`Invalid context key "${key}"`);
    }
    if (
      typeof value !== 'string' &&
      typeof value !== 'boolean' &&
      !(typeof value === 'number' && Number.isFinite(value))
    ) {
      throw new GetParameterError(`Invalid context value for key "${key}"`);
    }
    const encodedValue = JSON.stringify(value).replace(
      nonAsciiCodeUnitPattern,
      (character) =>
        `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
    );
    entries.push(`${key}=${encodedValue}`);
  }
  return entries.length === 0 ? undefined : entries.join(', ');
};

export { serializeContext, serializeFlags };
