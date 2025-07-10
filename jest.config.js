module.exports = {
  displayName: 'Root',
  projects: ['<rootDir>/apps/*/jest.config.js'],
  coverageDirectory: '<rootDir>/coverage/',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.(t|j)s',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.interface.ts',
  ],
};
