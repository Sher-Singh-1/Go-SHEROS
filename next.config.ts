import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // 10.200.107.131 is this machine's current LAN address, for testing from
  // another device on the same network — update if the machine's IP changes.
  allowedDevOrigins: ["127.0.0.1", "localhost", "10.200.107.131"],
};

export default nextConfig;
