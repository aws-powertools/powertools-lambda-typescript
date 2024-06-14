/**
 * These constants are used to store cleanup functions in Middy's `request.internal` object.
 * They are used by the `cleanupPowertools` function to check if any cleanup function
 * is present and execute it.
 */
const PREFIX = 'powertools-for-aws';
/**
 * Key to store the tracer instance in the `request.internal` object.
 *
 * @see {@link cleanupMiddlewares}
 */
const TRACER_KEY = `${PREFIX}.tracer`;
/**
 * Key to store the metrics instance in the `request.internal` object.
 *
 * @see {@link cleanupMiddlewares}
 */
const METRICS_KEY = `${PREFIX}.metrics`;
/**
 * Key to store the logger instance in the `request.internal` object.
 *
 * @see {@link cleanupMiddlewares}
 */
const LOGGER_KEY = `${PREFIX}.logger`;
/**
 * Key to store the idempotency instance in the `request.internal` object.
 *
 * @see {@link cleanupMiddlewares}
 */
const IDEMPOTENCY_KEY = `${PREFIX}.idempotency`;

export { PREFIX, TRACER_KEY, METRICS_KEY, LOGGER_KEY, IDEMPOTENCY_KEY };
