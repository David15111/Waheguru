
const dedicatedEndPoint = 'https://visam.infura-ipfs.io';
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
},
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [dedicatedEndPoint, 'visam.infura-ipfs.io'],
  },
};

module.exports = nextConfig;