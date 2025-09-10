import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./app/i18n/config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    authInterrupts: true, // Enable experimental authInterrupts for forbidden/unauthorized [^1]
    // Enable experimental features for better request handling
    serverComponentsExternalPackages: [], // Keep this empty to allow bundling
  },
  // Configure API route limits for large requests
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase body size limit for PDF uploads
    },
    responseLimit: '50mb', // Increase response limit for large API responses
  },
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
  async rewrites() {
    return [
      // Proxy OpenSign API functions to hide the real backend URL
      {
        source: '/api/proxy/opensign/:path*',
        destination: `${process.env.NEXT_PUBLIC_OPENSIGN_API_URL}/api/app/:path*`,
      },
      // Proxy OpenSign custom routes (file upload, conversion, etc.)
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_OPENSIGN_API_URL}/:path*`,
      },
      // Keep internal API routes as they are (these stay on your domain)
      // /api/cron/* and /api/usage-data/* will work normally
    ];
  },
};

export default withNextIntl(nextConfig);
