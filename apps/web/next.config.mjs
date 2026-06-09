/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@skripsita/shared'],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
