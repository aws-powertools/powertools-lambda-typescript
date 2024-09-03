import type { EnvironmentVariablesService } from '../config/EnvironmentVariablesService.js';
import type {
  LogAttributes,
  LogFormatterInterface,
  LogFormatterOptions,
} from '../types/Log.js';
import type { LogRecordOrder, UnformattedAttributes } from '../types/Logger.js';
import type { LogItem } from './LogItem.js';

/**
 * This class defines and implements common methods for the formatting of log attributes.
 *
 * @class
 */
abstract class LogFormatter implements LogFormatterInterface {
  /**
   * EnvironmentVariablesService instance.
   * If set, it allows to access environment variables.
   */
  protected envVarsService?: EnvironmentVariablesService;

  /**
   * An array of keys that defines the order of the log record.
   */
  protected logRecordOrder?: LogRecordOrder;

  public constructor(options?: LogFormatterOptions) {
    this.envVarsService = options?.envVarsService;
    this.logRecordOrder = options?.logRecordOrder;
  }

  /**
   * It formats key-value pairs of log attributes.
   *
   * @param {UnformattedAttributes} attributes - unformatted attributes
   * @param {LogAttributes} additionalLogAttributes - additional log attributes
   */
  public abstract formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem;

  /**
   * Format a given Error parameter.
   *
   * @param {Error} error - error to format
   * @returns {LogAttributes} formatted error
   */
  public formatError(error: Error): LogAttributes {
    return {
      name: error.name,
      location: this.getCodeLocation(error.stack),
      message: error.message,
      stack: error.stack,
      cause:
        error.cause instanceof Error
          ? this.formatError(error.cause)
          : error.cause,
    };
  }

  /**
   * Format a given date into an ISO 8601 string, considering the configured timezone.
   * If `envVarsService` is set and the configured timezone differs from 'UTC',
   * the date is formatted to that timezone. Otherwise, it defaults to 'UTC'.
   *
   * @param {Date} now - The date to format
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
   * Get a string containing the location of an error, given a particular stack trace.
   *
   * @param {string} stack - stack trace
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
   * and formatting options. The time is displayed in 24-hour format (hour12: false).
   *
   * @param {string} timeZone - IANA time zone identifier (e.g., "Asia/Dhaka").
   */
  #getDateFormatter = (timeZone: string): Intl.DateTimeFormat => {
    const twoDigitFormatOption = '2-digit';
    const validTimeZone = Intl.supportedValuesOf('timeZone').includes(timeZone)
      ? timeZone
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
   * @param {Date} date - date to format
   * @param {string} timeZone - IANA time zone identifier (e.g., "Asia/Dhaka").
   */
  #generateISOTimestampWithOffset(date: Date, timeZone: string): string {
    const { year, month, day, hour, minute, second } = this.#getDateFormatter(
      timeZone
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
