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
  }

  it('returns the correct cold start value', () => {
    // Prepare
    const utility = new TestUtility();

    // Act & Assess
    expect(utility.dummyMethod()).toBe(true);
    expect(utility.dummyMethod()).toBe(false);
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
});
