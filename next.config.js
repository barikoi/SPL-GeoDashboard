/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // basePath: '/spl',
  // assetPrefix: '/spl/',
  // trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
