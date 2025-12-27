/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Frontend path you will call in your code
        source: '/api/v1/:path*', 
        // The actual HTTP destination on EC2
        destination: 'http://3.216.174.254:8000/:path*', 
      },
    ]
  },
}
module.exports = nextConfig
