const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const webpack = require("webpack");

const nodeProtocolPolyfills = {
  "node:async_hooks": require.resolve("async-hooks"),
  "node:buffer": require.resolve("buffer"),
  "node:crypto": require.resolve("crypto-browserify"),
  "node:stream": require.resolve("stream-browserify"),
  "node:util": require.resolve("util"),
  "node:process": require.resolve("process/browser"),
};

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer"),
    process: require.resolve("process/browser"),
    util: require.resolve("util"),
    fs: false,
    net: false,
    tls: false,
    path: false,
    os: false,
    async_hooks: require.resolve("async-hooks"),
  };

  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      if (nodeProtocolPolyfills[resource.request]) {
        resource.request = nodeProtocolPolyfills[resource.request];
      } else {
        resource.request = resource.request.replace(/^node:/, "");
      }
    }),
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    })
  );

  return config;
};
