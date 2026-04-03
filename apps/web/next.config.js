const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sn8/database'],
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  distDir: '.next',
};

module.exports = nextConfig;
