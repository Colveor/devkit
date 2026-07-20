# @colveor/devkit

[![npm version](https://img.shields.io/npm/v/@colveor/devkit.svg)](https://www.npmjs.com/package/@colveor/devkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Shared development toolkit for every package in the Colveor ecosystem. Instead of copying TypeScript, ESLint, Prettier, Jest, and release configuration into each repository, extend or import settings from this package.

## Purpose

`@colveor/devkit` is the single source of truth for Colveor library development. It provides production-ready defaults optimized for:

- Node.js 20+
- TypeScript strict mode
- NestJS-style libraries (decorators, modules, DTOs)
- Conventional Commits and automated releases

## Installation

Install the devkit and peer dependencies in your package:

```bash
npm install --save-dev @colveor/devkit typescript eslint prettier jest ts-jest @types/jest @types/node
```

## TypeScript

Create a root `tsconfig.json` that extends the shared base config:

```json
{
  "extends": "@colveor/devkit/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

For builds, extend the build preset:

```json
{
  "extends": "@colveor/devkit/tsconfig.build.json"
}
```

For tests and Jest, extend the test preset:

```json
{
  "extends": "@colveor/devkit/tsconfig.test.json"
}
```

### Included defaults

- ES2022 target for Node.js 20+
- Strict type checking
- Decorator support for NestJS
- Declaration files and source maps
- Incremental compilation

## ESLint

Create `eslint.config.js` in your package root:

```javascript
const baseConfig = require('@colveor/devkit/eslint.config.js');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
];
```

The shared ESLint flat config includes:

- TypeScript type-aware linting
- Prettier compatibility (no conflicting formatting rules)
- Import sorting
- Consistent type-only imports
- Unused import removal
- Floating and misused promise detection
- Warnings for explicit `any`
- Relaxed rules in test files

Generated artifacts (`dist/`, `coverage/`, `*.d.ts`) are ignored automatically.

## Prettier

Extend the shared Prettier config in `prettier.config.js`:

```javascript
module.exports = {
  ...require('@colveor/devkit/prettier.config.js'),
};
```

Or reference it directly if your tooling supports config inheritance via `package.json`:

```json
{
  "prettier": "@colveor/devkit/prettier.config.js"
}
```

## Jest

Extend the shared Jest config in `jest.config.js`:

```javascript
/** @type {import('jest').Config} */
module.exports = {
  ...require('@colveor/devkit/jest.config.js'),
  // package-specific overrides
};
```

For Colveor NestJS libraries that keep specs under `test/**/*.spec.ts`, use the library preset:

```javascript
/** @type {import('jest').Config} */
module.exports = {
  ...require('@colveor/devkit/jest.library.config.js'),
  moduleNameMapper: {
    '^@colveor/my-package/package\\.json$': '<rootDir>/package.json',
  },
};
```

## ESLint library preset

For NestJS libraries (`@colveor/core`, `@colveor/fintech`, etc.), extend the library preset to ignore the local example app and relax unsafe-type rules in tests:

```javascript
const baseConfig = require('@colveor/devkit/eslint.library.config.js');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
];
```

Defaults include:

- `ts-jest` with `tsconfig.test.json`
- Node test environment
- Coverage collection from `src/`
- Sensible exclusions for NestJS boilerplate (modules, DTOs, entities)

Run tests:

```bash
npx jest
npx jest --coverage
```

## Semantic Release

Extend the shared release config in `release.config.js`:

```javascript
/** @type {import('semantic-release').GlobalConfig} */
module.exports = {
  ...require('@colveor/devkit/release.config.js'),
};
```

The shared config supports:

- Conventional Commits
- CHANGELOG generation
- npm publishing
- GitHub Releases
- Git commits for version bumps

### CI secrets

Configure these GitHub Actions secrets in your repository:

| Secret         | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `NPM_TOKEN`    | npm automation or granular token with publish access to your scope |
| `GITHUB_TOKEN` | Provided automatically by GitHub Actions                           |

When using `actions/setup-node` with `registry-url`, also pass `NODE_AUTH_TOKEN` in the release step (same value as `NPM_TOKEN`):

```yaml
- name: Release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
  run: npx semantic-release
```

See `.github/workflows/release.yml` in this repository for a complete reference workflow.

## CI

Copy `.github/workflows/library-ci.yml` from this package into consuming libraries (`@colveor/core`, `@colveor/fintech`, etc.).

For this devkit repo itself, use `.github/workflows/ci.yml` which validates config files only.

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm

- name: Enable Corepack
  run: corepack enable

- name: Install dependencies
  run: npm ci

- name: Lint
  run: npm run lint

- name: Validate
  run: npm run validate
```

See `.github/workflows/ci.yml` in this repository for the full template.

## lint-staged

Use the shared lint-staged config in your `package.json`:

```json
{
  "lint-staged": {
    "*.{js,ts}": ["prettier --write", "eslint --fix"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

Or extend directly:

```javascript
module.exports = require('@colveor/devkit/lint-staged.config.js');
```

## EditorConfig and Git

Copy or align with the shared `.editorconfig` and `.gitattributes` from this package for consistent formatting across editors and platforms.

Recommended `.gitignore` entries for Colveor libraries are included in this repository's `.gitignore`.

## VS Code

Recommended workspace settings and extensions are in `.vscode/settings.json` and `.vscode/extensions.json`. Copy them into consuming packages or reference them as a starting point.

## Best practices

1. **Extend, don't copy** — Import configs from `@colveor/devkit` so ecosystem-wide improvements roll out with a version bump.
2. **Keep overrides minimal** — Only add package-specific rules or paths when necessary.
3. **Use Conventional Commits** — Required for semantic versioning and automated changelogs.
4. **Pin devkit versions** — Use semver ranges that match your team's release cadence.
5. **Run checks locally** — Use `npm run check` before pushing; CI runs the same steps.
6. **Use the test tsconfig for Jest** — Keeps test-only types out of production builds.

## Local pack script

Libraries with an `example/` consumer app can pack a local tarball for integration testing:

```json
{
  "scripts": {
    "pack:local": "node node_modules/@colveor/devkit/scripts/pack-local.js"
  }
}
```

Defaults:

- output directory: `example/vendor`
- stable filename: `release.tgz`
- tarball scope filter: `colveor`

Override with environment variables when needed:

| Variable                  | Default            | Purpose                         |
| ------------------------- | ------------------ | ------------------------------- |
| `PACK_LOCAL_EXAMPLE_DIR`  | `example`          | Example app directory           |
| `PACK_LOCAL_VENDOR_DIR`   | `<example>/vendor` | Output directory                |
| `PACK_LOCAL_STABLE_NAME`  | `release.tgz`      | Stable tarball filename         |
| `PACK_LOCAL_SCOPE_PREFIX` | `colveor`          | npm pack filename prefix filter |

## Package contents

| Export                       | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `tsconfig.base.json`         | Base TypeScript compiler options            |
| `tsconfig.build.json`        | Production build preset                     |
| `tsconfig.test.json`         | Jest and test file preset                   |
| `eslint.config.js`           | ESLint v9 flat config                       |
| `eslint.library.config.js`   | ESLint preset for NestJS libraries          |
| `prettier.library.config.js` | Prettier preset for NestJS libraries (tabs) |
| `jest.config.js`             | Jest + ts-jest defaults                     |
| `jest.library.config.js`     | Jest preset for `test/**/*.spec.ts` layout  |
| `release.config.js`          | Semantic Release pipeline                   |
| `lint-staged.config.js`      | Optional pre-commit formatting and linting  |
| `pack-local.js`              | Build + pack tarball for local example apps |
| `init-library.js`            | Scaffold a new Colveor NestJS library       |
| `generate-api-docs.js`       | OpenAPI + Postman doc generation helper     |

## What's included

This package ships ready-to-use configuration for:

- **TypeScript** — base, build, and test tsconfigs
- **ESLint v9** — flat config with NestJS-friendly rules
- **Prettier** — consistent formatting defaults
- **Jest** — ts-jest setup with coverage defaults
- **Semantic Release** — Conventional Commits, changelog, npm, and GitHub releases
- **lint-staged config** — optional config for teams that want local git hooks
- **EditorConfig / Git** — editor and line-ending consistency
- **GitHub** — CI, release workflow, and issue/PR templates
- **VS Code** — recommended settings and extensions

## License

MIT © 2026 [Skyapp Labs](LICENSE)

See [LICENSE](LICENSE) for the full license text.
