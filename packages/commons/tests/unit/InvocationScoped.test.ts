import { InvokeStore } from '@aws/lambda-invoke-store';
import { sequence } from '@aws-lambda-powertools/testing-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InvocationScoped } from '../../src/InvocationScoped.js';

describe('Class: InvocationScoped', () => {
  beforeEach(() => {
    InvokeStore._testing?.reset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('without concurrency', () => {
    it('returns the initial value until one is set', () => {
      // Prepare
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act & Assess
      expect(cell.get()).toBe(12);
      expect(cell.isScoped).toBe(false);
    });

    it('creates the value only once when the cell is fresh', () => {
      // Prepare
      const fresh = vi.fn(() => ({ count: 0 }));
      const cell = new InvocationScoped('powertools.test.attributes', {
        fresh,
      });

      // Act
      const first = cell.get();
      const second = cell.get();

      // Assess
      expect(fresh).toHaveBeenCalledTimes(1);
      expect(second).toBe(first);
    });

    it('sets the value shared across invocations', () => {
      // Prepare
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act
      cell.set(8);

      // Assess
      expect(cell.get()).toBe(8);
      expect(cell.getShared()).toBe(8);
    });

    it('restores the initial value when reset', () => {
      // Prepare
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });
      cell.set(8);

      // Act
      cell.reset();

      // Assess
      expect(cell.get()).toBe(12);
    });

    it('creates a new value when a fresh cell is reset', () => {
      // Prepare
      const cell = new InvocationScoped('powertools.test.attributes', {
        fresh: () => ({ count: 0 }),
      });
      const first = cell.get();

      // Act
      cell.reset();

      // Assess
      expect(cell.get()).not.toBe(first);
    });

    it('holds a value that is itself undefined', () => {
      // Prepare
      const cell = new InvocationScoped<number | undefined>(
        'powertools.test.level',
        { initial: 12 }
      );

      // Act
      cell.set(undefined);

      // Assess
      expect(cell.get()).toBeUndefined();
    });

    it('sets the shared value directly', () => {
      // Prepare
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act
      cell.setShared(8);

      // Assess
      expect(cell.getShared()).toBe(8);
      expect(cell.get()).toBe(8);
    });
  });

  describe('with an unavailable InvokeStore', () => {
    beforeEach(() => {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      vi.stubGlobal('awslambda', undefined);
    });

    it.each([
      {
        method: 'get',
        action: (cell: InvocationScoped<number>) => cell.get(),
      },
      {
        method: 'set',
        action: (cell: InvocationScoped<number>) => cell.set(8),
      },
      {
        method: 'reset',
        action: (cell: InvocationScoped<number>) => cell.reset(),
      },
      {
        method: 'isScoped',
        action: (cell: InvocationScoped<number>) => cell.isScoped,
      },
    ])('throws when calling $method', ({ action }) => {
      // Prepare
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act & Assess
      expect(() => action(cell)).toThrow('InvokeStore is not available');
    });

    it('does not consult the InvokeStore for the shared value', () => {
      // Prepare
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act
      cell.setShared(8);

      // Assess
      expect(cell.getShared()).toBe(8);
    });
  });

  describe('without an active invocation context', () => {
    it('reads and writes the value shared across invocations', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act
      cell.set(8);

      // Assess
      expect(cell.get()).toBe(8);
      expect(cell.getShared()).toBe(8);
      expect(cell.isScoped).toBe(false);
    });

    it('restores the initial value when reset', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });
      cell.set(8);

      // Act
      cell.reset();

      // Assess
      expect(cell.getShared()).toBe(12);
    });
  });

  describe('within an invocation context', () => {
    it('scopes the value to the invocation', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act
      const scopedValue = store.run({}, () => {
        cell.set(8);

        return cell.get();
      });

      // Assess
      expect(scopedValue).toBe(8);
      expect(cell.isScoped).toBe(false);
      expect(cell.getShared()).toBe(12);
    });

    it('falls back to the value shared across invocations', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });
      cell.setShared(8);

      // Act
      const scopedValue = store.run({}, () => cell.get());

      // Assess
      expect(scopedValue).toBe(8);
    });

    it('creates a fresh value for each invocation', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped('powertools.test.attributes', {
        fresh: () => ({ count: 0 }),
      });

      // Act
      const [firstValue, firstValueAgain] = store.run({}, () => [
        cell.get(),
        cell.get(),
      ]);
      const secondValue = store.run({}, () => cell.get());

      // Assess
      expect(firstValueAgain).toBe(firstValue);
      expect(secondValue).not.toBe(firstValue);
    });

    it('bypasses the invocation context for the shared value', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act
      const scopedValue = store.run({}, () => {
        cell.setShared(8);

        return cell.get();
      });

      // Assess
      expect(scopedValue).toBe(8);
      expect(cell.getShared()).toBe(8);
    });

    it('reports that reads and writes are scoped', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act
      const isScoped = store.run({}, () => cell.isScoped);

      // Assess
      expect(isScoped).toBe(true);
    });

    it('falls back to the shared value when reset', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act
      const scopedValue = store.run({}, () => {
        cell.set(8);
        cell.reset();

        return cell.get();
      });

      // Assess
      expect(scopedValue).toBe(12);
    });

    it('creates a new value when a fresh cell is reset', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped('powertools.test.attributes', {
        fresh: () => ({ count: 0 }),
      });

      // Act
      const [firstValue, secondValue] = store.run({}, () => {
        const first = cell.get();
        cell.reset();

        return [first, cell.get()];
      });

      // Assess
      expect(secondValue).not.toBe(firstValue);
    });

    it('scopes a value created before any invocation context exists', async () => {
      // Prepare
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();

      // Act
      const scopedValue = store.run({}, () => {
        cell.set(8);

        return cell.get();
      });

      // Assess
      expect(scopedValue).toBe(8);
      expect(cell.getShared()).toBe(12);
    });

    it('shadows the shared value with an undefined value', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number | undefined>(
        'powertools.test.level',
        { initial: 12 }
      );
      cell.setShared(8);

      // Act
      const scopedValue = store.run({}, () => {
        cell.set(undefined);

        return cell.get();
      });

      // Assess
      expect(scopedValue).toBeUndefined();
      expect(cell.getShared()).toBe(8);
    });

    it('falls back to the shared value when reset after an undefined value', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number | undefined>(
        'powertools.test.level',
        { initial: 12 }
      );
      cell.setShared(8);

      // Act
      const scopedValue = store.run({}, () => {
        cell.set(undefined);
        cell.reset();

        return cell.get();
      });

      // Assess
      expect(scopedValue).toBe(8);
    });

    it('shadows the created value with an undefined value', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<{ count: number } | undefined>(
        'powertools.test.attributes',
        { fresh: () => ({ count: 0 }) }
      );

      // Act
      const scopedValue = store.run({}, () => {
        cell.get();
        cell.set(undefined);

        return cell.get();
      });

      // Assess
      expect(scopedValue).toBeUndefined();
    });

    it('creates a new value when reset after an undefined value', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      const store = await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<{ count: number } | undefined>(
        'powertools.test.attributes',
        { fresh: () => ({ count: 0 }) }
      );

      // Act
      const scopedValue = store.run({}, () => {
        cell.set(undefined);
        cell.reset();

        return cell.get();
      });

      // Assess
      expect(scopedValue).toEqual({ count: 0 });
    });

    it('isolates concurrent invocations from each other', async () => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      await InvokeStore.getInstanceAsync();
      const cell = new InvocationScoped<number>('powertools.test.level', {
        initial: 12,
      });

      // Act
      const [firstValue, secondValue] = await sequence<number, number>(
        {
          sideEffects: [() => cell.set(8), () => {}],
          return: () => cell.get(),
        },
        {
          sideEffects: [() => {}, () => cell.set(20)],
          return: () => cell.get(),
        },
        { useInvokeStore: true }
      );

      // Assess
      expect(firstValue).toBe(8);
      expect(secondValue).toBe(20);
      expect(cell.getShared()).toBe(12);
    });
  });
});
