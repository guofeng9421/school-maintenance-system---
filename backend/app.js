require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { readDB } = require('./config/db')
const authRoutes = require('./routes/auth')
const maintenanceRoutes = require('./routes/maintenance')
const bimfaceRoutes = require('./routes/bimface')

const app = express()
const PORT = 3001

// 中间件配置
app.use(cors())                    // 跨域支持
app.use(express.json())            // JSON 请求体解析
app.use(express.urlencoded({ extended: true })) // URL 编码请求体解析
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))  // 静态文件：提供上传图片的访问

// 路由配置
app.use('/api/auth', authRoutes)           // 认证相关接口（登录/注册/用户信息）
app.use('/api/maintenance', maintenanceRoutes) // 维修记录相关接口（CRUD/统计）
app.use('/api/bimface', bimfaceRoutes)     // BIMface 接口（Access Token/View Token）

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: '服务运行正常' })
})

// 启动服务：先读取数据库，再监听端口
async function start() {
  readDB()
  app.listen(PORT, () => {
    console.log(`服务已启动: http://localhost:${PORT}`)
  })
}

start().catch(console.error)
