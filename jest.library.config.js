/** @type {import('jest').Config} */
module.exports = {
  ...require('./jest.config.js'),
  testRegex: undefined,
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
};
