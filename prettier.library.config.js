const devkit = require('@colveor/devkit/prettier.config.js');

/** @type {import('prettier').Config} */
module.exports = {
  ...devkit,
  useTabs: true,
  tabWidth: 4,
};
