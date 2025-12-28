/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api_backend/:path*',
        destination: 'http://3.216.174.254:8000/:path*', // Your EC2 Address
      },
    ]
  },
}

module.exports = nextConfig
