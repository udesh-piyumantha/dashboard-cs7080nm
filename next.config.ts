import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://func-cs7080nm-api.azurewebsites.net/api/:path*',
      },
    ];
  },
};

export default nextConfig;
