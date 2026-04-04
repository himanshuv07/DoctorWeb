// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['sequelize'],
  // ← nothing else needed, instrumentation.ts works automatically in Next.js 15+
};

export default nextConfig;