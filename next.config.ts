import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Disable linting during the build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Skip type checking during the build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
