/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // This makes the browser think the request is to your own secure domain
        source: '/backend-api/:path*',
        // This is where Vercel securely forwards the request to your EC2
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
