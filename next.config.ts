import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Package the Node server and runtime dependencies for self-hosted Docker deploys.
  output: "standalone",
  // Keep the local development indicator from covering the mobile Home tab.
  devIndicators: false,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};

export default nextConfig;
