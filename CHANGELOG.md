## [1.7.0](https://github.com/colveor/devkit/compare/v1.6.0...v1.7.0) (2026-07-20)

### Features

* add library presets, init-library scaffold, and CI templates ([ea3cd80](https://github.com/colveor/devkit/commit/ea3cd805a3378f3ce0c457cba40af1993505889d))

### Bug Fixes

* **release:** add conventional-changelog-conventionalcommits dependency ([f737b85](https://github.com/colveor/devkit/commit/f737b858fe3f7960db251d553b625b3ef3a487ec))
* **release:** restore semver baseline and trigger 1.7.0 publish ([fe6aa9b](https://github.com/colveor/devkit/commit/fe6aa9b928c10d299cd30c35cbc5678703377dd6))

## 1.6.0 (2026-07-06)

* feat: bump version to 1.6.0 and update refresh token key in API docs script ([854f8b1](https://github.com/colveor/devkit/commit/854f8b1))

## 1.5.0 (2026-07-06)

* feat: bump version to 1.5.0 and add Postman auth inheritance normalization ([7eaddba](https://github.com/colveor/devkit/commit/7eaddba))

## 1.4.0 (2026-07-06)

* feat: release 1.4.0 ([4f11e2f](https://github.com/colveor/devkit/commit/4f11e2f))

## 1.3.0 (2026-07-06)

* feat: bump version to 1.4.0 and update Postman environment variable names ([1754d98](https://github.com/colveor/devkit/commit/1754d98))
* refactor: consolidate generated Postman collections and add automated token refresh support ([daef62b](https://github.com/colveor/devkit/commit/daef62b))

## 1.2.0 (2026-07-05)

* feat: generate a global index.json manifest in api-docs script and bump package version to 1.2.0 ([0bba755](https://github.com/colveor/devkit/commit/0bba755))

## 1.1.0 (2026-07-05)

* feat: add API documentation generation script and integrate openapi-to-postmanv2 dependency ([c20b498](https://github.com/colveor/devkit/commit/c20b498))
* chore: release version 1.0.6, added script and update .gitignore ([9f86c28](https://github.com/colveor/devkit/commit/9f86c28))
* chore: release version 1.0.7, update pack-local script and rename output file ([207f3a1](https://github.com/colveor/devkit/commit/207f3a1))
* chore: update ESLint and release version 1.0.9 ([b1df311](https://github.com/colveor/devkit/commit/b1df311))
* chore: update ts-jest peer dependency version to >=29 ([de993d2](https://github.com/colveor/devkit/commit/de993d2))

## <small>1.0.5 (2026-07-03)</small>

* Merge pull request #3 from Colveor/v1.0.5 ([65439d5](https://github.com/colveor/devkit/commit/65439d5)), closes [#3](https://github.com/colveor/devkit/issues/3)
* fix(deps): prepare 1.0.5 release ([0f5a8ec](https://github.com/colveor/devkit/commit/0f5a8ec))
* chore: clean ups ([1ea5ba5](https://github.com/colveor/devkit/commit/1ea5ba5))

## 1.0.5 (2026-07-03)

* fix(deps): bump `jest` and `ts-jest` peer dependencies to `>=30`
* fix(deps): pin `unrs-resolver` via npm overrides for consistent ESLint resolution
* chore(ci): drop lockfile check from devkit CI (`npm ci` remains the gate)

## <small>1.0.4 (2026-07-03)</small>

* Merge pull request #2 from Colveor/fix/ci-lockfile-sync ([9fbaa7f](https://github.com/colveor/devkit/commit/9fbaa7f)), closes [#2](https://github.com/colveor/devkit/issues/2)
* chore: update lockfile sync check to use npm 10.8.2 ([57a1c8c](https://github.com/colveor/devkit/commit/57a1c8c))
* fix(ci): add lockfile sync check to shared CI template ([99fa3a9](https://github.com/colveor/devkit/commit/99fa3a9))
* fix(ci): pin npm version for lockfile sync check ([670a6a1](https://github.com/colveor/devkit/commit/670a6a1))

## 1.0.4 (2026-07-03)

* fix(ci): add lockfile sync check step to shared CI workflow template
* feat(ci): add `lockfile:sync` and `lockfile:check` scripts with shared check script
* docs: document CI lockfile scripts and reference workflow in README

## 1.0.3 (2026-07-03)

* chore: disable lint-staged backup stash in pre-commit hook
* docs: update README pre-commit setup to use `--no-stash`
* chore: normalize GitHub repository URLs to lowercase org name

## 1.0.2 (2026-07-03)

* docs: expand README with CI secrets, package contents, and license details
* chore: add repository metadata and include CHANGELOG in published package

## 1.0.1 (2026-07-03)

* chore(release): manual version bump

## 1.0.0 (2026-07-02)

* fix: add NODE_AUTH_TOKEN to release workflow for authentication ([cd9ab77](https://github.com/Colveor/devkit/commit/cd9ab77))
* feat: add production devkit configuration ([b761309](https://github.com/Colveor/devkit/commit/b761309))
* initial commit ([3ad562d](https://github.com/Colveor/devkit/commit/3ad562d))
* Update package.json to set private to false, add license, and configure publish settings for public  ([f3ae724](https://github.com/Colveor/devkit/commit/f3ae724))
