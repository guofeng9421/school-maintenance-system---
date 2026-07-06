const express = require('express')
const axios = require('axios')
const bimfaceConfig = require('../config/bimface')
const { authMiddleware } = require('../middleware/auth')
const { query } = require('../config/db')

const router = express.Router()

let cachedToken = null
let tokenExpireTime = 0

// 生成 Basic Auth header
function getAuthHeader() {
  const encoded = Buffer.from(`${bimfaceConfig.appKey}:${bimfaceConfig.appSecret}`).toString('base64')
  return `Basic ${encoded}`
}

// 内部获取 Access Token（带缓存）
async function getAccessToken() {
  const now = Date.now()
  if (cachedToken && now < tokenExpireTime) {
    return cachedToken
  }

  const response = await axios.post(
    `${bimfaceConfig.apiBase}/oauth2/token`,
    {},
    { headers: { Authorization: getAuthHeader() } }
  )

  if (response.data.code === 'success') {
    cachedToken = response.data.data.token
    tokenExpireTime = new Date(response.data.data.expireTime).getTime() - 3600000
    return cachedToken
  }

  throw new Error(response.data.message || '获取 Access Token 失败')
}

// GET /api/bimface/token - 获取 Access Token（供前端直接调用）
router.get('/token', authMiddleware, async (req, res) => {
  try {
    if (!bimfaceConfig.appKey || !bimfaceConfig.appSecret) {
      return res.json({ code: 400, message: '未配置 BIMface appKey/appSecret' })
    }
    const token = await getAccessToken()
    res.json({ code: 200, data: { token } })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// GET /api/bimface/view-token/:fileId - 根据 fileId 获取 View Token
router.get('/view-token/:fileId', authMiddleware, async (req, res) => {
  try {
    if (!bimfaceConfig.appKey || !bimfaceConfig.appSecret) {
      return res.json({ code: 400, message: '未配置 BIMface appKey/appSecret' })
    }

    const accessToken = await getAccessToken()
    const response = await axios.get(
      `${bimfaceConfig.apiBase}/view/token?fileId=${req.params.fileId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    const { code, data, message } = response.data
    if (code === 'success') {
      return res.json({ code: 200, data: { viewToken: data } })
    }

    res.json({ code: 500, data: null, message: message || '获取 View Token 失败' })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// GET /api/bimface/models - 从数据库读取所有模型，批量获取 viewToken 返回给前端
router.get('/models', authMiddleware, async (req, res) => {
  try {
    if (!bimfaceConfig.appKey || !bimfaceConfig.appSecret) {
      return res.json({ code: 400, message: '未配置 BIMface appKey/appSecret' })
    }

    const models = query('bim_models')
    if (models.length === 0) {
      return res.json({ code: 200, data: [] })
    }

    const accessToken = await getAccessToken()

    const results = await Promise.all(models.map(async (model) => {
      try {
        const response = await axios.get(
          `${bimfaceConfig.apiBase}/view/token?fileId=${model.fileId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        )
        if (response.data.code === 'success') {
          const rawData = response.data.data
          const viewToken = (typeof rawData === 'object' && rawData !== null) ? (rawData.viewToken || rawData.token) : rawData
          return {
            id: model.id,
            name: model.name,
            token: viewToken || null,
            description: model.description || '',
            position: model.position || { x: 0, y: 0, z: 0 },
            visible: model.visible !== false
          }
        }
        return { ...model, token: null }
      } catch (err) {
        console.error(`获取模型 ${model.name} viewToken 失败:`, err.message)
        return { ...model, token: null }
      }
    }))

    res.json({ code: 200, data: results })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

module.exports = router
