const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const prismaClientDir = path.join(root, 'node_modules', '.prisma', 'client');

function ensureSymlink(target, source) {
  const parent = path.dirname(target);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }

  let shouldLink = true;
  try {
    const stat = fs.lstatSync(target);
    if (stat.isSymbolicLink()) {
      const current = fs.readlinkSync(target);
      const resolved = path.resolve(parent, current);
      if (resolved === source) {
        shouldLink = false;
      } else {
        fs.rmSync(target, { recursive: true, force: true });
      }
    } else {
      fs.rmSync(target, { recursive: true, force: true });
    }
  } catch {}

  if (shouldLink) {
    fs.symlinkSync(source, target, 'dir');
    console.log('Linked Prisma client:', target, '->', source);
  } else {
    console.log('Prisma client already linked:', target);
  }
}

const targets = new Set([
  path.join(root, 'apps', 'api', 'node_modules', '.prisma', 'client'),
]);

try {
  const resolveBases = [
    path.join(root, 'apps', 'api'),
    path.join(root, 'packages', 'database'),
  ];

  for (const base of resolveBases) {
    try {
      const prismaPackagePath = require.resolve('@prisma/client', { paths: [base] });
      const prismaRuntimeClientDir = path.join(
        path.dirname(prismaPackagePath),
        '..',
        '..',
        '.prisma',
        'client',
      );
      targets.add(prismaRuntimeClientDir);
    } catch {}
  }
} catch {}

if (targets.size === 1) {
  console.warn('Could not resolve pnpm runtime Prisma client path. Only app symlink will be updated.');
}

for (const target of targets) {
  try {
    ensureSymlink(target, prismaClientDir);
  } catch (error) {
    console.error('Failed to link Prisma client for', target, error);
    process.exitCode = 1;
  }
}
