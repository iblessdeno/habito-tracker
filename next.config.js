/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@hookform/resolvers',
    'zod',
    'react-hook-form',
    '@supabase/supabase-js'
  ],
  webpack: (config, { isServer, dev }) => {
    // Fix for "Module not found: Can't resolve 'fs'" error
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        path: false,
      };
    }

    // Add resolve extensions for better module resolution
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', ...config.resolve.extensions];

    // Fix for "__webpack_require__.n is not a function" error
    // This specifically addresses compatibility issues between ESM and CommonJS
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false, // Disable the requirement for specifying extension for imports
      },
    });

    // For development, make sure we're using the appropriate optimizations
    if (dev) {
      config.optimization.moduleIds = 'named';
      config.optimization.chunkIds = 'named';
    }

    return config;
  },
  // Disable React strict mode to avoid double renders during development
  reactStrictMode: false,
  // Use the standalone build output
  output: 'standalone',
  // Configure images to allow Supabase domains
  images: {
    domains: [
      // Extract domain from Supabase URL or use a fallback
      process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
        : 'supabase.co',
    ],
  },
  // Disable TypeScript type checking and linting during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
