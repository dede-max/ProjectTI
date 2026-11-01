/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Hanya aktifkan proxy lokal jika tidak ada NEXT_PUBLIC_API_URL (mode development)
    if (process.env.NEXT_PUBLIC_API_URL) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5000/api/:path*'
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://127.0.0.1:5000/socket.io/:path*'
      }
    ];
  }
};

export default nextConfig;
