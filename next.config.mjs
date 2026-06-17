/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint is run separately; don't block production builds on lint errors.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
