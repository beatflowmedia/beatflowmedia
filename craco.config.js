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

      return webpackConfig;
    },
  },
};
