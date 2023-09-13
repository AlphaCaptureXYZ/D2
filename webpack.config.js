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
