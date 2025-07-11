import type { NextConfig } from "next";
import type { Configuration } from "webpack";
import webpack from "webpack";

const nextConfig: NextConfig = {
  webpack: (config: Configuration): Configuration => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        ...(config.resolve?.fallback || {}),
        buffer: require.resolve("buffer/"),
        stream: require.resolve("stream-browserify"),
        crypto: require.resolve("crypto-browserify"),
      },
    };

    config.plugins = [
      ...(config.plugins || []),
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: "process/browser",
      }),
    ];

    return config;
  },
};

export default nextConfig;
