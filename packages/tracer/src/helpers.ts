import { Tracer } from '.';
import type { TracerOptions } from './types';

/**
 * Create a new tracer instance with the given options.
 *
 * @deprecated - This function will be removed in the next major release. Use the Tracer class directly instead.
 */
const createTracer = (options: TracerOptions = {}): Tracer =>
  new Tracer(options);

export { createTracer };
