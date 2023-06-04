import { BINDING_POWER } from '../constants';
import type { JSONValue } from './JSON';

/**
 * TODO: write docs for Token type
 */
type Token = {
  type: keyof typeof BINDING_POWER;
  value: JSONValue;
  start: number;
  end: number;
};

export { Token };
