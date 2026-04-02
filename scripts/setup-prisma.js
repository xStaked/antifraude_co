const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const prismaClientDir = path.join(root, 'node_modules', '.prisma', 'client');

const targets = [
  path.join(root, 'apps', 'api', 'node_modules', '.prisma', 'client'),
];

for (const target of targets) {
  const parent = path.dirname(target);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
  let exists = false;
  try {
    fs.lstatSync(target);
    exists = true;
  } catch {}
  if (!exists) {
    fs.symlinkSync(prismaClientDir, target, 'dir');
    console.log('Created symlink:', target, '->', prismaClientDir);
  } else {
    console.log('Symlink already exists:', target);
  }
}
