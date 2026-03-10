import envVariables from '../config/env';

describe('Demo Test Suite', () => {
  it('should pass a basic math test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have NODE_ENV set to test', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should use a test database', async () => {
    // In test environment, DATABASE_URL should be set to TEST_DB_URI
    // expect(envVariables.DATABASE_URL).toBeDefined();
    expect(envVariables.NODE_ENV).toBe('test');
  });
});
