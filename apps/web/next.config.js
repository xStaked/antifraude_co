/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sn8/database'],
  outputFileTracingRoot: __dirname,
  distDir: '.next',
};

module.exports = nextConfig;
