/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "xmsreelwxwqjzgtkxcje.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
