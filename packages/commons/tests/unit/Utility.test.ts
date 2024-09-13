import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Utility } from '../../src/index.js';

describe('Class: Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('Method: getDefaultServiceName', () => {
    it('returns the default service name', () => {
      class PowerTool extends Utility {
        public dummyMethod(): string {
          return this.getDefaultServiceName();
        }
      }

      const powertool = new PowerTool();
      const result = powertool.dummyMethod();
      expect(result).toBe('service_undefined');
    });
  });

  describe('Method: getColdStart', () => {
    it('it returns true the first time, then false afterwards, when called multiple times', () => {
      // Prepare
      const utility = new Utility();
      const getColdStartSpy = vi.spyOn(utility, 'getColdStart');

      // Act
      utility.getColdStart();
      utility.getColdStart();
      utility.getColdStart();
      utility.getColdStart();
      utility.getColdStart();

      // Assess
      expect(getColdStartSpy).toHaveBeenCalledTimes(5);
      expect(getColdStartSpy.mock.results).toEqual([
        expect.objectContaining({ value: true }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
      ]);
    });

    it('returns the correct values when subclassed', () => {
      // Prepare
      class PowerTool extends Utility {
        public dummyMethod(): boolean {
          return this.getColdStart();
        }
      }
      const powertool = new PowerTool();
      const dummyMethodSpy = vi.spyOn(powertool, 'dummyMethod');
      const getColdStartSpy = vi.spyOn(powertool, 'getColdStart');

      // Act
      powertool.dummyMethod();
      powertool.dummyMethod();
      powertool.dummyMethod();
      powertool.dummyMethod();
      powertool.dummyMethod();

      // Assess
      expect(dummyMethodSpy).toHaveBeenCalledTimes(5);
      expect(getColdStartSpy).toHaveBeenCalledTimes(5);
      expect(dummyMethodSpy.mock.results).toEqual([
        expect.objectContaining({ value: true }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
      ]);
    });
  });

  describe('Method: isColdStart', () => {
    it('returns true the first time, then false afterwards when called multiple times', () => {
      // Prepare
      const utility = new Utility();
      const isColdStartSpy = vi.spyOn(utility, 'isColdStart');

      // Act
      utility.isColdStart();
      utility.isColdStart();
      utility.isColdStart();
      utility.isColdStart();
      utility.isColdStart();

      // Assess
      expect(isColdStartSpy).toHaveBeenCalledTimes(5);
      expect(isColdStartSpy.mock.results).toEqual([
        expect.objectContaining({ value: true }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
      ]);
    });

    it('returns the correct values when subclassed', () => {
      // Prepare
      class PowerTool extends Utility {
        public dummyMethod(): boolean {
          return this.isColdStart();
        }
      }
      const powertool = new PowerTool();
      const dummyMethodSpy = vi.spyOn(powertool, 'dummyMethod');
      const isColdStartSpy = vi.spyOn(powertool, 'isColdStart');

      // Act
      powertool.dummyMethod();
      powertool.dummyMethod();
      powertool.dummyMethod();
      powertool.dummyMethod();
      powertool.dummyMethod();

      // Assess
      expect(dummyMethodSpy).toHaveBeenCalledTimes(5);
      expect(isColdStartSpy).toHaveBeenCalledTimes(5);
      expect(dummyMethodSpy.mock.results).toEqual([
        expect.objectContaining({ value: true }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
        expect.objectContaining({ value: false }),
      ]);
    });
  });

  describe('Method: isValidServiceName', () => {
    class PowerTool extends Utility {
      public dummyMethod(name: string): boolean {
        return this.isValidServiceName(name);
      }
    }
    it('allows valid strings', () => {
      const powertool = new PowerTool();
      const goodName = 'serverlessAirline';

      const result = powertool.dummyMethod(goodName);

      expect(result).toBe(true);
    });

    it("doesn't allow empty strings", () => {
      const tooShort = '';
      const powertool = new PowerTool();
      const result = powertool.dummyMethod(tooShort);

      expect(result).toBe(false);
    });
  });
});
