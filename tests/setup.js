/**
 * Jest Test Setup
 * Configures global test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password123@localhost:5432/passes_mktr_test';
process.env.APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || 'TEST_TEAM_ID';
process.env.PASS_TYPE_ID = process.env.PASS_TYPE_ID || 'pass.com.test.wallet';
process.env.APPLE_CERT_PATH = process.env.APPLE_CERT_PATH || './tests/fixtures/test-cert.p12';
process.env.APPLE_CERT_PASSWORD = process.env.APPLE_CERT_PASSWORD || 'test-password';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
