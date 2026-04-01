/** @type {import('next').NextConfig} */
const nextConfig = {
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
