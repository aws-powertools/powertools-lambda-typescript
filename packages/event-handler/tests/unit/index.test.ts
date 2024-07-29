/**
 * Test Event Handler
 *
 * @group unit/event-handler
 */
import { foo } from '../../src/index.js';

describe('Event Handler', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  it('should return true', () => {
    // Act
    const result = foo();

    // Assess
    expect(result).toBe(true);
  });
});
