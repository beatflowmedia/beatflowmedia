// craco.config.js
// Custom webpack configuration to suppress third-party source map warnings
// while keeping source maps for our own code

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress source map warnings from node_modules (third-party packages)
      // but keep source maps for our own code for debugging
      webpackConfig.ignoreWarnings = [
        // Ignore source map warnings from music-metadata-browser package
        /Failed to parse source map.*music-metadata-browser/,
        /Failed to parse source map.*music-metadata/,
        // Ignore source map warnings from other node_modules packages
        function(warning) {
          return (
            warning.module &&
            warning.module.resource &&
            warning.module.resource.includes('node_modules') &&
            warning.message &&
            warning.message.includes('source map')
          );
        },
      ];

      // Optimize chunk splitting for better caching and loading
      if (webpackConfig.mode === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              // Split vendor code into separate chunks
              firebase: {
                test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
                name: 'firebase',
                priority: 30,
                reuseExistingChunk: true,
              },
              stripe: {
                test: /[\\/]node_modules[\\/](@stripe)[\\/]/,
                name: 'stripe',
                priority: 25,
                reuseExistingChunk: true,
              },
              mui: {
                test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
                name: 'mui',
                priority: 20,
                reuseExistingChunk: true,
              },
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
                name: 'react-vendors',
                priority: 15,
                reuseExistingChunk: true,
              },
              commons: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                reuseExistingChunk: true,
              },
            },
          },
          runtimeChunk: 'single',
        };
      }

      return webpackConfig;
    },
  },
};
