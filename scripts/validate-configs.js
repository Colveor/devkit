const fs = require('node:fs');
const path = require('node:path');

const jsonFiles = [
  'tsconfig.base.json',
  'tsconfig.build.json',
  'tsconfig.test.json',
  'package.json',
];

for (const file of jsonFiles) {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');

  try {
    JSON.parse(content);
  } catch (error) {
    console.error(`Invalid JSON in ${file}:`, error.message);
    process.exit(1);
  }
}

console.log(`Validated ${jsonFiles.length} JSON config files.`);
