/**
 * We have single entry point for all the powertools modules so that functions that need only one
 * can bundle only that one that they need and keep the bundle size small.
 */
import { logger } from './logger.js';
import { metrics } from './metrics.js';
import { tracer } from './tracer.js';

// We export all three modules for those functions who need to use all of them
export { logger, metrics, tracer };
