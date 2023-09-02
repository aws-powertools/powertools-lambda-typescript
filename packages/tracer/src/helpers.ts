import { Tracer } from '.';
import type { TracerOptions } from './types';

const createTracer = (options: TracerOptions = {}): Tracer =>
  new Tracer(options);

export { createTracer };
