module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Exclude server entry point
    '!src/**/index.js', // Exclude index files
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  verbose: true,
  
  // Handle ES modules and other file types
  moduleFileExtensions: ['js', 'json', 'node'],
  
  // Global test setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
