module.exports = {
  devServer: {
    open: true,
    port: 3002,
    disableHostCheck: true,
  },
  pwa: {
    workboxOptions: {
      exclude: [/\.map$/, /_redirects/],
    },
  },
};
