import createNextIntlPlugin from 'next-intl/plugin';

// Re-introduce the next-intl plugin and point it to routing.ts
const withNextIntl = createNextIntlPlugin('./app/i18n/routing.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  trailingSlash: true,
  // REMOVED: output: 'export' - This enables SSR and API Routes
  // Image optimization
  images: {
    // unoptimized: true, // No longer needed if not exporting statically
    domains: ['localhost'], // Keep if you have local images
    formats: ['image/avif', 'image/webp'],
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  },
  // Webpack configuration for client-side bundle optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side bundle optimizations
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
          },
        },
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizeCss: true,
  }
}

// Export with the next-intl plugin
export default withNextIntl(nextConfig);
