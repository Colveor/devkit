const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const lockfilePath = path.join(process.cwd(), 'package-lock.json');

if (!fs.existsSync(lockfilePath)) {
  console.error('No package-lock.json found.');
  process.exit(1);
}

const original = fs.readFileSync(lockfilePath, 'utf8');

try {
  execSync('npm install --package-lock-only --ignore-scripts --no-audit', { stdio: 'pipe' });
} catch {
  process.exit(1);
}

const updated = fs.readFileSync(lockfilePath, 'utf8');

if (original !== updated) {
  fs.writeFileSync(lockfilePath, original);
  const npmVersion = execSync('npm -v', { encoding: 'utf8' }).trim();
  console.error(
    `package-lock.json is out of sync with package.json (npm ${npmVersion}).`,
  );
  console.error('Run: corepack enable && npm run lockfile:sync');
  process.exit(1);
}

console.log('package-lock.json is in sync with package.json.');
