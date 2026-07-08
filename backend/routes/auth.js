const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query, findById, insert, update, remove } = require('../config/db')
const jwtConfig = require('../config/jwt')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// POST /api/auth/login - 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    // 查找用户
    const users = query('users', u => u.username === username)
    if (users.length === 0) {
      return res.json({ code: 400, message: '用户名或密码错误' })
    }
    const user = users[0]
    // 验证密码（bcrypt 比对）
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.json({ code: 400, message: '用户名或密码错误' })
    }
    // 生成 JWT token（有效期 24 小时）
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, real_name: user.real_name },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    )
    res.json({
      code: 200,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          real_name: user.real_name,
          role: user.role,
          phone: user.phone
        }
      }
    })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// POST /api/auth/register - 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, real_name, role, phone } = req.body
    // 检查用户名是否已存在
    const exists = query('users', u => u.username === username)
    if (exists.length > 0) {
      return res.json({ code: 400, message: '用户名已存在' })
    }
    // 密码加密后存储
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = insert('users', {
      username,
      password: hashedPassword,
      real_name,
      role: role || 'teacher',
      phone: phone || ''
    })
    res.json({ code: 200, message: '注册成功', data: { id: user.id } })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// GET /api/auth/userinfo - 获取当前用户信息（需登录）
router.get('/userinfo', authMiddleware, async (req, res) => {
  try {
    const user = findById('users', req.user.id)
    if (!user) return res.json({ code: 404, message: '用户不存在' })
    const { password, ...info } = user // 排除密码字段
    res.json({ code: 200, data: info })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// GET /api/auth/users - 获取所有用户列表（需登录）
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = query('users').map(({ password, ...u }) => u) // 排除所有用户的密码
    res.json({ code: 200, data: users })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// POST /api/auth - 新增用户（管理员）
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { username, password, real_name, role, phone } = req.body
    const exists = query('users', u => u.username === username)
    if (exists.length > 0) {
      return res.json({ code: 400, message: '用户名已存在' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = insert('users', {
      username,
      password: hashedPassword,
      real_name,
      role: role || 'teacher',
      phone: phone || ''
    })
    res.json({ code: 200, message: '新增成功', data: { id: user.id } })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// PUT /api/auth/:id - 更新用户信息
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const user = findById('users', id)
    if (!user) return res.json({ code: 404, message: '用户不存在' })

    const { username, password, real_name, role, phone } = req.body
    const updates = {}
    if (username !== undefined) updates.username = username
    if (password) updates.password = await bcrypt.hash(password, 10)
    if (real_name !== undefined) updates.real_name = real_name
    if (role !== undefined) updates.role = role
    if (phone !== undefined) updates.phone = phone

    update('users', id, updates)
    res.json({ code: 200, message: '更新成功' })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// DELETE /api/auth/:id - 删除用户
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    remove('users', parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

module.exports = router
