const jwt = require('jsonwebtoken')
const jwtConfig = require('../config/jwt')

// JWT 认证中间件：验证请求头中的 Bearer token
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' })
  }
  try {
    // 验证 token 有效性，解码后将用户信息挂载到 req.user
    const decoded = jwt.verify(token, jwtConfig.secret)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
}

// 管理员权限中间件：必须在 authMiddleware 之后使用
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '权限不足' })
  }
  next()
}

module.exports = { authMiddleware, adminMiddleware }
