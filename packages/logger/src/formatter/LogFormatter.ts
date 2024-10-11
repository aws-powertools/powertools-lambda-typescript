import type { EnvironmentVariablesService } from '../config/EnvironmentVariablesService.js';
import type { LogAttributes } from '../types/Logger.js';
import type { LogFormatterOptions } from '../types/formatters.js';
import type { UnformattedAttributes } from '../types/logKeys.js';
import type { LogItem } from './LogItem.js';

/**
 * Class that defines and implements common methods for the formatting of log attributes.
 *
 * When creating a custom log formatter, you should extend this class and implement the
 * {@link formatAttributes | formatAttributes()} method to define the structure of the log item.
 *
 * @abstract
 */
abstract class LogFormatter {
  /**
   * Instance of the {@link EnvironmentVariablesService} to use for configuration.
   */
  protected envVarsService?: EnvironmentVariablesService;

  public constructor(options?: LogFormatterOptions) {
    this.envVarsService = options?.envVarsService;
  }

  /**
   * Format key-value pairs of log attributes.
   *
   * You should implement this method in a subclass to define the structure of the log item.
   *
   * @example
   * ```typescript
   * import { LogFormatter, LogItem } from '@aws-lambda-powertools/logger';
   * import type {
   *   LogAttributes,
   *   UnformattedAttributes,
   * } from '@aws-lambda-powertools/logger/types';
   *
   * class MyCompanyLogFormatter extends LogFormatter {
   *   public formatAttributes(
   *     attributes: UnformattedAttributes,
   *     additionalLogAttributes: LogAttributes
   *   ): LogItem {
   *     const baseAttributes: MyCompanyLog = {
   *       message: attributes.message,
   *       service: attributes.serviceName,
   *       environment: attributes.environment,
   *       awsRegion: attributes.awsRegion,
   *       correlationIds: {
   *         awsRequestId: attributes.lambdaContext?.awsRequestId,
   *         xRayTraceId: attributes.xRayTraceId,
   *       },
   *       lambdaFunction: {
   *         name: attributes.lambdaContext?.functionName,
   *         arn: attributes.lambdaContext?.invokedFunctionArn,
   *         memoryLimitInMB: attributes.lambdaContext?.memoryLimitInMB,
   *         version: attributes.lambdaContext?.functionVersion,
   *         coldStart: attributes.lambdaContext?.coldStart,
   *       },
   *       logLevel: attributes.logLevel,
   *       timestamp: this.formatTimestamp(attributes.timestamp), // You can extend this function
   *       logger: {
   *         sampleRateValue: attributes.sampleRateValue,
   *       },
   *     };
   *
   *     const logItem = new LogItem({ attributes: baseAttributes });
   *     // add any attributes not explicitly defined
   *     logItem.addAttributes(additionalLogAttributes);
   *
   *     return logItem;
   *   }
   * }
   *
   * export { MyCompanyLogFormatter };
   * ```
   *
   * @param attributes - Unformatted attributes
   * @param additionalLogAttributes - Additional log attributes
   */
  public abstract formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem;

  /**
   * Format an error into a loggable object.
   *
   * @example
   * ```json
   * {
   *   "name": "Error",
   *   "location": "file.js:1",
   *   "message": "An error occurred",
   *   "stack": "Error: An error occurred\n    at file.js:1\n    at file.js:2\n    at file.js:3",
   *   "cause": {
   *     "name": "OtherError",
   *     "location": "file.js:2",
   *     "message": "Another error occurred",
   *     "stack": "Error: Another error occurred\n    at file.js:2\n    at file.js:3\n    at file.js:4"
   *   }
   * }
   * ```
   *
   * @param error - Error to format
   */
  public formatError(error: Error): LogAttributes {
    const { name, message, stack, cause, ...errorAttributes } = error;
    const formattedError: LogAttributes = {
      name,
      location: this.getCodeLocation(error.stack),
      message,
      stack,
      cause:
        error.cause instanceof Error
          ? this.formatError(error.cause)
          : error.cause,
    };
    for (const key in error) {
      if (
        typeof key === 'string' &&
        key !== 'name' &&
        key !== 'message' &&
        key !== 'stack' &&
        key !== 'cause'
      ) {
        formattedError[key] = (errorAttributes as Record<string, unknown>)[key];
      }
    }

    return formattedError;
  }

  /**
   * Format a date into an ISO 8601 string with the configured timezone.
   *
   * If the log formatter is passed an {@link EnvironmentVariablesService} instance
   * during construction, the timezone is read from the `TZ` environment variable, if present.
   *
   * Otherwise, the timezone defaults to ':UTC'.
   *
   * @param now - The date to format
   */
  public formatTimestamp(now: Date): string {
    const defaultTimezone = 'UTC';

    /**
     * If a specific timezone is configured and it's not the default `UTC`,
     * format the timestamp with the appropriate timezone offset.
     **/
    const configuredTimezone = this.envVarsService?.getTimezone();
    if (configuredTimezone && !configuredTimezone.includes(defaultTimezone))
      return this.#generateISOTimestampWithOffset(now, configuredTimezone);

    return now.toISOString();
  }

  /**
   * Get the location of an error from a stack trace.
   *
   * @param stack - stack trace to parse
   */
  public getCodeLocation(stack?: string): string {
    if (!stack) {
      return '';
    }

    const stackLines = stack.split('\n');
    const regex = /\(([^)]*?):(\d+?):(\d+?)\)\\?$/;

    for (const item of stackLines) {
      const match = regex.exec(item);

      if (Array.isArray(match)) {
        return `${match[1]}:${Number(match[2])}`;
      }
    }

    return '';
  }

  /**
   * Create a new Intl.DateTimeFormat object configured with the specified time zone
   * and formatting options.
   *
   * The time is displayed in 24-hour format (hour12: false).
   *
   * @param timezone - IANA time zone identifier (e.g., "Asia/Dhaka").
   */
  #getDateFormatter = (timezone: string): Intl.DateTimeFormat => {
    const twoDigitFormatOption = '2-digit';
    const validTimeZone = Intl.supportedValuesOf('timeZone').includes(timezone)
      ? timezone
      : 'UTC';

    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: twoDigitFormatOption,
      day: twoDigitFormatOption,
      hour: twoDigitFormatOption,
      minute: twoDigitFormatOption,
      second: twoDigitFormatOption,
      hour12: false,
      timeZone: validTimeZone,
    });
  };

  /**
   * Generate an ISO 8601 timestamp string with the specified time zone and the local time zone offset.
   *
   * @param date - date to format
   * @param timezone - IANA time zone identifier (e.g., "Asia/Dhaka").
   */
  #generateISOTimestampWithOffset(date: Date, timezone: string): string {
    const { year, month, day, hour, minute, second } = this.#getDateFormatter(
      timezone
    )
      .formatToParts(date)
      .reduce(
        (acc, item) => {
          acc[item.type] = item.value;

          return acc;
        },
        {} as Record<Intl.DateTimeFormatPartTypes, string>
      );
    const datePart = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    const offset = -date.getTimezoneOffset();
    const offsetSign = offset >= 0 ? '+' : '-';
    const offsetHours = Math.abs(Math.floor(offset / 60))
      .toString()
      .padStart(2, '0');
    const offsetMinutes = Math.abs(offset % 60)
      .toString()
      .padStart(2, '0');
    const millisecondPart = date.getMilliseconds().toString().padStart(3, '0');
    const offsetPart = `${offsetSign}${offsetHours}:${offsetMinutes}`;

    return `${datePart}.${millisecondPart}${offsetPart}`;
  }
}

export { LogFormatter };
