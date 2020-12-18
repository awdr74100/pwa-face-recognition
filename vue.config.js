module.exports = {
  pages: {
    index: {
      entry: 'src/main.js',
      title: '人臉識別',
    },
  },
  devServer: {
    open: true,
    port: 3002,
    disableHostCheck: true,
  },
  pwa: {
    name: 'Recognition',
    themeColor: '#20c997',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxOptions: {
      exclude: [/\.map$/, /_redirects/],
    },
  },
};
