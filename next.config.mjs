import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./app/i18n/config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    authInterrupts: true, // Enable experimental authInterrupts for forbidden/unauthorized [^1]
  },
  // Move serverComponentsExternalPackages to top level (renamed to serverExternalPackages in Next.js 15)
  serverExternalPackages: [], // Keep this empty to allow bundling
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle PDF.js worker
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      }
    }
    
    // Copy PDF.js worker files
    config.resolve.alias['pdfjs-dist/build/pdf.worker.min.js'] = 'pdfjs-dist/build/pdf.worker.min.js'
    
    return config
  },
};

export default withNextIntl(nextConfig);
