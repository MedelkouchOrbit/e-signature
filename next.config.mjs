import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./app/i18n/config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    authInterrupts: true, // Enable experimental authInterrupts for forbidden/unauthorized [^1]
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
