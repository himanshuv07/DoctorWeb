import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['sequelize'], // ← moved out of experimental
};

export default nextConfig;