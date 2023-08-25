/**
 * These constants are used to store cleanup functions in Middy's `request.internal` object.
 * They are used by the `cleanupPowertools` function to check if any cleanup function
 * is present and execute it.
 */
const PREFIX = 'powertools-for-aws';
const TRACER_KEY = `${PREFIX}.tracer`;
const METRICS_KEY = `${PREFIX}.metrics`;
const LOGGER_KEY = `${PREFIX}.logger`;
const IDEMPOTENCY_KEY = `${PREFIX}.idempotency`;

export { PREFIX, TRACER_KEY, METRICS_KEY, LOGGER_KEY, IDEMPOTENCY_KEY };
