import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@graphctx/context-pack-exporter",
    "@graphctx/graph-actions",
    "@graphctx/graph-schema",
  ],
};

export default nextConfig;
