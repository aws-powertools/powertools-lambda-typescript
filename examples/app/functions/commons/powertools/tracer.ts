import { Tracer } from '@aws-lambda-powertools/tracer';
import { serviceName } from './constants.js';

/**
 * Create tracer instance with centralized configuration so that
 * all traces have the same service name as an annotation.
 */
const tracer = new Tracer({
  serviceName,
});

export { tracer };
