import { describe, expect, it } from 'vitest';
import { Utility } from '../../src/index.js';

describe('Class: Utility', () => {
  class TestUtility extends Utility {
    public dummyMethod(): boolean {
      return this.getColdStart();
    }
    public isColdStart(): boolean {
      return this.coldStart;
    }
    public getServiceName(): string {
      return this.defaultServiceName;
    }
    public validateServiceName(serviceName: string): boolean {
      return this.isValidServiceName(serviceName);
    }
    public getInitializationType():
      | 'unknown'
      | 'on-demand'
      | 'provisioned-concurrency' {
      return super.getInitializationType();
    }
  }

  it('returns the correct cold start value', () => {
    // Prepare
    const utility = new TestUtility();

    // Act & Assess
    expect(utility.dummyMethod()).toBe(true);
    expect(utility.dummyMethod()).toBe(false);
    expect(utility.dummyMethod()).toBe(false);
  });

  it('returns the correct cold start value when provisioned concurrency is used', () => {
    // Prepare
    process.env.AWS_LAMBDA_INITIALIZATION_TYPE = 'provisioned-concurrency';
    const utility = new TestUtility();

    // Act & Assess
    expect(utility.dummyMethod()).toBe(false);
  });

  it('flips the cold start value', () => {
    // Prepare
    const utility = new TestUtility();

    // Act
    utility.dummyMethod();

    // Assess
    expect(utility.isColdStart()).toBe(false);
  });

  it('returns the correct default service name', () => {
    // Prepare
    const utility = new TestUtility();

    // Assess
    expect(utility.getServiceName()).toBe('service_undefined');
  });

  it('validates service name', () => {
    // Prepare
    const utility = new TestUtility();

    // Act & Assess
    expect(utility.validateServiceName('serverlessAirline')).toBe(true);
    expect(utility.validateServiceName('')).toBe(false);
  });

  it.each([
    { value: 'on-demand', expected: 'on-demand' },
    { value: 'provisioned-concurrency', expected: 'provisioned-concurrency' },
    { value: '', expected: 'unknown' },
  ])(
    'returns the correct initialization type ($value)',
    ({ value, expected }) => {
      // Prepare
      process.env.AWS_LAMBDA_INITIALIZATION_TYPE = value;
      const utility = new TestUtility();

      // Act
      const initializationType = utility.getInitializationType();

      // Assess
      expect(initializationType).toBe(expected);
    }
  );
});
