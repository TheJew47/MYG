/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // 1. Matches the '/api_backend' seen in your browser console
        source: '/api_backend/:path*',
        // 2. Automatically injects the '/api' prefix that main.py expects
        destination: `http://3.216.174.254:8000/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
