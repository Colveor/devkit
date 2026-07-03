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

Initialize Git hooks in your repository:

```bash
npx husky init
```

Then wire Husky to the shared configs:

```bash
echo "npx lint-staged --no-stash --config node_modules/@colveor/devkit/lint-staged.config.js" > .husky/pre-commit
echo 'npx --no -- commitlint --config node_modules/@colveor/devkit/commitlint.config.js --edit "$1"' > .husky/commit-msg
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

Copy `.github/workflows/ci.yml` from this package as a starting point, or mirror its steps in your own workflow.

Add these scripts to your `package.json` (copy `scripts/check-lockfile-sync.js` from this package into your repo — it has no dependencies and must exist before `npm ci` in CI):

```bash
mkdir -p scripts
cp node_modules/@colveor/devkit/scripts/check-lockfile-sync.js scripts/
```

```json
{
  "scripts": {
    "lockfile:sync": "npm install --package-lock-only --ignore-scripts --no-audit",
    "lockfile:check": "node scripts/check-lockfile-sync.js",
    "validate": "node scripts/validate-configs.js"
  }
}
```

| Script           | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `lockfile:sync`  | Regenerate `package-lock.json` after changing `package.json`            |
| `lockfile:check` | Fail if the lockfile is out of sync (used in CI before `npm ci`)        |
| `validate`       | Optional project-specific checks (JSON configs, env files, etc.)        |

Run `lockfile:sync` locally whenever you edit dependencies, then commit the updated lockfile.

Reference workflow (lockfile check runs **before** install — no `node_modules` required):

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm

- name: Check lockfile sync
  run: npm run lockfile:check

- name: Install dependencies
  run: npm ci

- name: Lint
  run: npm run lint

- name: Validate
  run: npm run validate
```

See `.github/workflows/ci.yml` in this repository for the full template.

## Commitlint

Use the shared Commitlint config:

```javascript
module.exports = require('@colveor/devkit/commitlint.config.js');
```

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(storage): add S3 adapter
fix(api): handle null tenant id
chore: update devkit
```

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
5. **Run hooks locally** — Husky + lint-staged catch issues before CI.
6. **Use the test tsconfig for Jest** — Keeps test-only types out of production builds.

## Package contents

| Export                  | Description                       |
| ----------------------- | --------------------------------- |
| `tsconfig.base.json`    | Base TypeScript compiler options  |
| `tsconfig.build.json`   | Production build preset           |
| `tsconfig.test.json`    | Jest and test file preset         |
| `eslint.config.js`      | ESLint v9 flat config             |
| `prettier.config.js`    | Prettier formatting defaults      |
| `jest.config.js`        | Jest + ts-jest defaults           |
| `release.config.js`     | Semantic Release pipeline         |
| `commitlint.config.js`  | Conventional Commits rules        |
| `lint-staged.config.js`        | Pre-commit formatting and linting |
| `scripts/check-lockfile-sync.js` | Lockfile sync check for CI        |

## What's included

This package ships ready-to-use configuration for:

- **TypeScript** — base, build, and test tsconfigs
- **ESLint v9** — flat config with NestJS-friendly rules
- **Prettier** — consistent formatting defaults
- **Jest** — ts-jest setup with coverage defaults
- **Semantic Release** — Conventional Commits, changelog, npm, and GitHub releases
- **Commitlint** — commit message enforcement
- **Husky + lint-staged** — local pre-commit and commit-msg hooks
- **EditorConfig / Git** — editor and line-ending consistency
- **GitHub** — CI, release workflow, and issue/PR templates
- **VS Code** — recommended settings and extensions

## License

MIT © 2026 [Skyapp Labs](LICENSE)

See [LICENSE](LICENSE) for the full license text.
