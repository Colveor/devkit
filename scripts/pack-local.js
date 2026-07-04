const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const vendorDir = path.resolve(rootDir, 'example/vendor');

fs.mkdirSync(vendorDir, { recursive: true });

// Build first so the packed tarball contains fresh dist output
execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

// Pack into example/vendor
execSync(`npm pack --pack-destination "${vendorDir}"`, {
  stdio: 'inherit',
  cwd: rootDir,
});

// Find the generated tgz
const tgz = fs
  .readdirSync(vendorDir)
  .filter((file) => file.startsWith('colveor') && file.endsWith('.tgz'))
  .sort()
  .pop();

if (!tgz) {
  throw new Error('npm pack did not produce a tarball');
}

// Copy to a stable filename for the example app
const stableName = path.join(vendorDir, 'release.tgz');
fs.copyFileSync(path.join(vendorDir, tgz), stableName);

//delete the tgz file
fs.unlinkSync(path.join(vendorDir, tgz));

console.log(`Renamed to\x1b[36m colveor-package.tgz\x1b[0m in\x1b[33m example/vendor\x1b[0m`);
