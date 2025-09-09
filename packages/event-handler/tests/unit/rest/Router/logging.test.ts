import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpVerbs } from '../../../../src/rest/constants.js';
import { Router } from '../../../../src/rest/Router.js';
import type { RouterOptions } from '../../../../src/types/rest.js';

describe('Class: Router - Logging', () => {
  class TestResolver extends Router {
    constructor(options?: RouterOptions) {
      super(options);
      this.logger.debug('test debug');
      this.logger.warn('test warn');
      this.logger.error('test error');
    }
  }

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the global console when no logger is not provided', () => {
    // Act
    const app = new TestResolver();
    app.route(async () => ({ success: true }), {
      path: '/',
      method: HttpVerbs.GET,
    });

    // Assess
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('test error');
    expect(console.warn).toHaveBeenCalledWith('test warn');
  });

  it('emits debug logs using global console when the log level is set to `DEBUG` and a logger is not provided', () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');

    // Act
    const app = new TestResolver();
    app.route(async () => ({ success: true }), {
      path: '/',
      method: HttpVerbs.GET,
    });

    // Assess
    expect(console.debug).toHaveBeenCalledWith('test debug');
    expect(console.error).toHaveBeenCalledWith('test error');
    expect(console.warn).toHaveBeenCalledWith('test warn');
  });

  it('uses a custom logger when provided', () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    // Act
    const app = new TestResolver({ logger });
    app.route(async () => ({ success: true }), {
      path: '/',
      method: HttpVerbs.GET,
    });

    // Assess
    expect(logger.error).toHaveBeenCalledWith('test error');
    expect(logger.warn).toHaveBeenCalledWith('test warn');
    expect(logger.debug).toHaveBeenCalledWith('test debug');
  });
});
