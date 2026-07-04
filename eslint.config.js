const eslint = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const unusedImports = require('eslint-plugin-unused-imports');
const prettierConfig = require('eslint-config-prettier');

const sharedRules = {
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
  ],
  '@typescript-eslint/no-unused-vars': 'off',
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': [
    'warn',
    {
      vars: 'all',
      varsIgnorePattern: '^_',
      args: 'after-used',
      argsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': [
    'error',
    {
      checksVoidReturn: {
        arguments: false,
        attributes: false,
      },
    },
  ],
  '@typescript-eslint/strict-boolean-expressions': [
    'warn',
    {
      allowString: true,
      allowNullableString: true,
      allowNumber: true,
      allowNullableNumber: true,
      allowNullableObject: true,
      allowNullableBoolean: true,
    },
  ],
  '@typescript-eslint/no-explicit-any': 'warn',
  'simple-import-sort/imports': 'error',
  'simple-import-sort/exports': 'error',
};

/** @type {import('eslint').Linter.Config[]} */
const config = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.d.ts',
      '**/*.js.map',
      '**/CHANGELOG.md',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommendedTypeChecked],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: sharedRules,
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: globals.node,
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'simple-import-sort/imports': sharedRules['simple-import-sort/imports'],
      'simple-import-sort/exports': sharedRules['simple-import-sort/exports'],
      'unused-imports/no-unused-imports': sharedRules['unused-imports/no-unused-imports'],
      'unused-imports/no-unused-vars': sharedRules['unused-imports/no-unused-vars'],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
    },
  },
);

module.exports = config;
