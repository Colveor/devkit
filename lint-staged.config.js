/** @type {import('lint-staged').Configuration} */
module.exports = {
  '*.{js,ts}': ['prettier --write', 'eslint --fix'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};
