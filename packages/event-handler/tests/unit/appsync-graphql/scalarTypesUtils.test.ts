import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  awsDate,
  awsDateTime,
  awsTime,
  awsTimestamp,
  makeId,
} from '../../../src/appsync-graphql/index.js';

const mockDate = new Date('2025-06-15T10:30:45.123Z');

describe('Scalar Types Utils', () => {
  beforeAll(() => {
    vi.useFakeTimers().setSystemTime(mockDate);
  });

  afterAll(() => {
    vi.useRealTimers();
  });
  describe('makeId', () => {
    it('should generate a valid UUID', () => {
      const id = makeId();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });

    it('should generate unique IDs', () => {
      const id1 = makeId();
      const id2 = makeId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('awsDate', () => {
    it('returns a date in YYYY-MM-DD format with Z timezone', () => {
      // Act
      const result = awsDate();

      // Assess
      expect(result).toBe('2025-06-15Z');
    });

    it('handles a positive timezone offset', () => {
      // Act
      const result = awsDate(5);

      // Assess
      expect(result).toBe('2025-06-15+05:00:00');
    });

    it('handles a negative timezone offset', () => {
      // Act
      const result = awsDate(-8);

      // Assess
      expect(result).toBe('2025-06-15-08:00:00');
    });

    it('handle a date change with timezone offset', () => {
      // Act
      const result = awsDate(-11);

      // Assess
      expect(result).toBe('2025-06-14-11:00:00');
    });

    it('handles a fractional timezone offset', () => {
      // Act
      const result = awsDate(5.5);

      // Assess
      expect(result).toBe('2025-06-15+05:30:00');
    });

    it('handles a negative fractional timezone offset', () => {
      // Act
      const result = awsDate(-9.5);

      // Assess
      expect(result).toBe('2025-06-15-09:30:00');
    });

    it('throws a RangeError for invalid timezone offset', () => {
      // Act & Assess
      expect(() => awsDate(15)).toThrow(RangeError);
      expect(() => awsDate(-13)).toThrow(RangeError);
    });
  });

  describe('awsTime', () => {
    it('returns a time in HH:MM:SS.sss format with Z timezone', () => {
      // Act
      const result = awsTime();

      // Assess
      expect(result).toBe('10:30:45.123Z');
    });

    it('handles a positive timezone offset', () => {
      // Act
      const result = awsTime(3);

      // Assess
      expect(result).toBe('13:30:45.123+03:00:00');
    });

    it('handles a negative timezone offset', () => {
      // Act
      const result = awsTime(-5);

      // Assess
      expect(result).toBe('05:30:45.123-05:00:00');
    });

    it('handles a fractional timezone offset', () => {
      // Act
      const result = awsTime(5.5);

      // Assess
      expect(result).toBe('16:00:45.123+05:30:00');
    });

    it('throws a RangeError for invalid timezone offset', () => {
      // Act & Assess
      expect(() => awsTime(15)).toThrow(RangeError);
      expect(() => awsTime(-13)).toThrow(RangeError);
    });
  });

  describe('awsDateTime', () => {
    it('return a datetime in ISO 8601 format with Z timezone', () => {
      // Act
      const result = awsDateTime();

      // Assess
      expect(result).toBe('2025-06-15T10:30:45.123Z');
    });

    it('handles a positive timezone offset', () => {
      // Act
      const result = awsDateTime(2);

      // Assess
      expect(result).toBe('2025-06-15T12:30:45.123+02:00:00');
    });

    it('handles a negative timezone offset', () => {
      // Act
      const result = awsDateTime(-7);

      // Assess
      expect(result).toBe('2025-06-15T03:30:45.123-07:00:00');
    });

    it('handles date/time change with timezone offset', () => {
      // Act
      const result = awsDateTime(-11);

      // Assess
      expect(result).toBe('2025-06-14T23:30:45.123-11:00:00');
    });

    it('handles a fractional timezone offset', () => {
      // Act
      const result = awsDateTime(5.5);

      // Assess
      expect(result).toBe('2025-06-15T16:00:45.123+05:30:00');
    });

    it('handles a negative fractional timezone offset', () => {
      // Act
      const result = awsDateTime(-9.5);

      // Assess
      expect(result).toBe('2025-06-15T01:00:45.123-09:30:00');
    });

    it('throws a RangeError for invalid timezone offset', () => {
      // Act & Assess
      expect(() => awsDateTime(15)).toThrow(RangeError);
      expect(() => awsDateTime(-13)).toThrow(RangeError);
    });
  });

  describe('awsTimestamp', () => {
    it('returns the current time as Unix timestamp in seconds', () => {
      // Act
      const result = awsTimestamp();

      // Assess
      expect(result).toBe(Math.floor(mockDate.getTime() / 1000));
    });
  });
});
