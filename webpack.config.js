const dotenv = require("dotenv-webpack");

module.exports = {
  resolve: {
    fallback: {
      "crypto": false,
      "zlib": false,
      "buffer": false,
      "assert": false, 
      "constants": false,
    },
  },
  externals: {
    'node:fs': 'commonjs2 node:fs',
    'node:buffer': 'node:buffer',
    'node:https': 'node:https',
    'node:http': 'node:http',
    'node:net': 'node:net',
    'node:path': 'node:path',
    'node:process': 'node:process',
    'node:stream/web': 'node:stream/web',
    'node:stream': 'node:stream',
    'node:url': 'node:url',
    'node:util': 'node:util',
    'node:zlib': 'node:zlib',
  },  
  node: { global: true },
  output: {
    libraryTarget: "umd",
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: "raw-loader",
      },
      {
        test: /\.txt$/,
        use: "raw-loader",
      },
    ],
    
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new dotenv({
      systemvars: true,
    }),
  ],
};
