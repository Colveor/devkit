const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.env.npm_package_json
  ? path.dirname(process.env.npm_package_json)
  : process.cwd();

const exampleDir = process.env.PACK_LOCAL_EXAMPLE_DIR || 'example';
const vendorDir = path.resolve(
  rootDir,
  process.env.PACK_LOCAL_VENDOR_DIR || path.join(exampleDir, 'vendor'),
);
const stableName = process.env.PACK_LOCAL_STABLE_NAME || 'release.tgz';
const scopePrefix = process.env.PACK_LOCAL_SCOPE_PREFIX || 'colveor';

fs.mkdirSync(vendorDir, { recursive: true });

// Build first so the packed tarball contains fresh dist output
execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

execSync(`npm pack --pack-destination "${vendorDir}"`, {
  stdio: 'inherit',
  cwd: rootDir,
});

const tgz = fs
  .readdirSync(vendorDir)
  .filter((file) => file.startsWith(scopePrefix) && file.endsWith('.tgz'))
  .sort()
  .pop();

if (!tgz) {
  throw new Error(`npm pack did not produce a tarball matching scope "${scopePrefix}"`);
}

const stablePath = path.join(vendorDir, stableName);
fs.copyFileSync(path.join(vendorDir, tgz), stablePath);
fs.unlinkSync(path.join(vendorDir, tgz));

console.log(
  `Packed to \x1b[36m${stableName}\x1b[0m in \x1b[33m${path.relative(rootDir, vendorDir)}\x1b[0m`,
);
