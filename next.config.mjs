/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: '(?:.*\\.vercel\\.app)' }],
        destination: 'https://toque2me.com/:path*',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cybernecard.fr' },
      { protocol: 'https', hostname: 'cdn.toptex.com' },
      { protocol: 'http', hostname: 'cdn.toptex.com' },
    ],
  },
};

export default nextConfig;
