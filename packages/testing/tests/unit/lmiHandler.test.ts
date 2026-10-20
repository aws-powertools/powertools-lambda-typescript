import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureJsonStdout, createPeerBarrier } from '../../src/lmi/handler.js';

describe('LMI handler helpers', () => {
  describe('captureJsonStdout', () => {
    const originalWrite = process.stdout.write;
    let forward: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      forward = vi.fn(() => true);
      process.stdout.write = forward as unknown as typeof process.stdout.write;
    });

    afterEach(() => {
      process.stdout.write = originalWrite;
    });

    it('collects JSON objects and forwards every chunk', () => {
      // Prepare
      const captured = captureJsonStdout<{ message: string }>();

      // Act
      process.stdout.write('{"message":"one"}\n');
      process.stdout.write('plain text\n');
      process.stdout.write('42\n');
      process.stdout.write(Buffer.from('{"message":"two"}\n'));

      // Assess
      expect(captured).toEqual([{ message: 'one' }, { message: 'two' }]);
      expect(forward).toHaveBeenCalledTimes(4);
      expect(forward).toHaveBeenNthCalledWith(2, 'plain text\n');
    });
  });

  describe('createPeerBarrier', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resolves to true for both callers when two invocations overlap', async () => {
      // Prepare
      const awaitPeer = createPeerBarrier();

      // Act
      const results = await Promise.all([awaitPeer(), awaitPeer()]);

      // Assess
      expect(results).toEqual([true, true]);
    });

    it('resolves to false when no peer arrives before the timeout', async () => {
      // Prepare
      const awaitPeer = createPeerBarrier({ timeoutMs: 1_000 });

      // Act
      const pending = awaitPeer();
      await vi.advanceTimersByTimeAsync(1_000);

      // Assess
      await expect(pending).resolves.toBe(false);
    });

    it('resets once every caller has left so a later invocation waits again', async () => {
      // Prepare
      const awaitPeer = createPeerBarrier({ timeoutMs: 1_000 });
      await Promise.all([awaitPeer(), awaitPeer()]);

      // Act
      const pending = awaitPeer();
      await vi.advanceTimersByTimeAsync(1_000);

      // Assess
      await expect(pending).resolves.toBe(false);
    });
  });
});
