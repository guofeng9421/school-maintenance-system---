const path = require('path')

module.exports = {
  // Webpack 配置：路径别名 + 禁用 copy 插件
  chainWebpack: config => {
    config.resolve.alias
      .set('@', path.resolve(__dirname, 'src'))  // @ 指向 src 目录
    config.plugins.delete('copy')                // 删除默认的 copy-webpack-plugin
  },
  // 开发服务器配置：端口 + API 代理
  devServer: {
    port: 3000,                        // 前端开发服务器端口
    proxy: {
      // 代理 /api 请求到后端服务
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // 代理 /uploads 静态文件请求到后端服务
      '/uploads': {
          target: 'http://localhost:8080',
          changeOrigin: true
      }
    }
  }
}
