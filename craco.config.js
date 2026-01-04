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

      // Enhanced chunk splitting for better caching and lazy loading
      if (webpackConfig.mode === 'production') {
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 25,
            maxAsyncRequests: 25,
            minSize: 20000,
            cacheGroups: {
              // React core - most stable, highest priority
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                name: 'react-core',
                priority: 40,
                reuseExistingChunk: true,
              },
              // Router - separate for better caching
              router: {
                test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/,
                name: 'react-router',
                priority: 35,
                reuseExistingChunk: true,
              },
              // Firebase - large library, separate chunk
              firebase: {
                test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
                name: 'firebase',
                priority: 30,
                reuseExistingChunk: true,
              },
              // MUI components - large UI library
              mui: {
                test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
                name: 'mui',
                priority: 25,
                reuseExistingChunk: true,
              },
              // Stripe - payment library
              stripe: {
                test: /[\\/]node_modules[\\/](@stripe|stripe)[\\/]/,
                name: 'stripe',
                priority: 23,
                reuseExistingChunk: true,
              },
              // Charts library - heavy, defer loading
              charts: {
                test: /[\\/]node_modules[\\/](recharts)[\\/]/,
                name: 'charts',
                priority: 22,
                reuseExistingChunk: true,
              },
              // Other vendor code
              vendors: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                reuseExistingChunk: true,
              },
              // Common code shared across routes
              common: {
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true,
                enforce: true,
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
