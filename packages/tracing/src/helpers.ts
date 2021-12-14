import { Tracer } from '.';
import { TracerOptions } from '../types';

const createTracer = (options: TracerOptions = {}): Tracer => new Tracer(options);

export {
  createTracer
};