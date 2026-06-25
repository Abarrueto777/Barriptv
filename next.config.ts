import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow testing from phones/other devices on the LAN during `next dev`: without
  // this, Next 16 blocks its dev resources cross-origin and the client never
  // hydrates (forms stop working). Dev-only; ignored in production builds.
  allowedDevOrigins: ['192.168.1.76'],
  experimental: {
    // proxy.ts buffers the request body for every route it runs on (default 10MB cap).
    // Our M3U playlist uploads can be 20MB+, so this needs to match the size sanity
    // check in lib/ingest.ts (MAX_SIZE_BYTES).
    proxyClientMaxBodySize: '100mb',
  },
};

export default nextConfig;
