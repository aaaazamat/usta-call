import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production'da rasm'larni qaerdan yuklash mumkin
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
