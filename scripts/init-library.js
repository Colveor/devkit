#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const devkitRoot = path.join(__dirname, '..');
const packageName = process.env.npm_package_name || path.basename(targetDir);

function write(relativePath, content) {
  const filePath = path.join(targetDir, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (fs.existsSync(filePath)) {
    console.log(`skip  ${relativePath} (already exists)`);
    return;
  }
  fs.writeFileSync(filePath, content);
  console.log(`write ${relativePath}`);
}

function copy(relativePath) {
  const source = path.join(devkitRoot, relativePath);
  const destination = path.join(targetDir, relativePath);
  if (fs.existsSync(destination)) {
    console.log(`skip  ${relativePath} (already exists)`);
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`copy  ${relativePath}`);
}

const mapperName = packageName.replace('@colveor/', '').replace(/-/g, '_');

write(
  'eslint.config.js',
  `const baseConfig = require('@colveor/devkit/eslint.library.config.js');

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
`,
);

write(
  'jest.config.js',
  `/** @type {import('jest').Config} */
module.exports = {
  ...require('@colveor/devkit/jest.library.config.js'),
  moduleNameMapper: {
    '^${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/package\\\\.json$': '<rootDir>/package.json',
  },
};
`,
);

write(
  'release.config.js',
  `/** @type {import('semantic-release').GlobalConfig} */
module.exports = {
  ...require('@colveor/devkit/release.config.js'),
};
`,
);

write(
  'prettier.config.js',
  `const devkit = require('@colveor/devkit/prettier.library.config.js');

/** @type {import('prettier').Config} */
module.exports = {
  ...devkit,
};
`,
);

write(
  'test/smoke.spec.ts',
  `describe('test harness', () => {
  it('runs', () => {
    expect(true).toBe(true);
  });
});
`,
);

copy('.github/workflows/library-ci.yml');
copy('.github/workflows/library-release.yml');
copy('.github/PULL_REQUEST_TEMPLATE.md');

const ciWorkflow = path.join(targetDir, '.github/workflows/library-ci.yml');
if (fs.existsSync(ciWorkflow)) {
  fs.renameSync(ciWorkflow, path.join(targetDir, '.github/workflows/ci.yml'));
}

const releaseWorkflow = path.join(targetDir, '.github/workflows/library-release.yml');
if (fs.existsSync(releaseWorkflow)) {
  fs.renameSync(releaseWorkflow, path.join(targetDir, '.github/workflows/release.yml'));
}

console.log(`\nInitialized Colveor library scaffolding in ${targetDir}`);
