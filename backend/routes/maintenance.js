const express = require('express')
const multer = require('multer')           // 文件上传中间件
const path = require('path')
const { query, findById, insert, update, remove, count } = require('../config/db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// multer 磁盘存储配置：文件保存到 backend/uploads 目录
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  // 文件名：时间戳 + 随机字符串 + 原始扩展名，避免重名
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext)
  }
})
// multer 实例配置：限制10MB，仅允许图片格式
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 单文件最大10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|bmp|webp)$/i
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true)
    } else {
      cb(new Error('仅支持图片文件'))
    }
  }
})

// POST /api/maintenance/upload - 上传图片（最多9张）
router.post('/upload', authMiddleware, upload.array('images', 9), (req, res) => {
  try {
    // 将上传的文件转换为访问URL返回给前端
    const urls = req.files.map(f => '/uploads/' + f.filename)
    res.json({ code: 200, data: urls })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// GET /api/maintenance/list - 获取维修记录列表（支持分页、筛选、搜索）
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, category, priority, keyword } = req.query
    let filter = null

    // 构建筛选条件
    filter = (r) => {
      if (status && r.status !== status) return false
      if (category && r.category !== category) return false
      if (priority && r.priority !== priority) return false
      // 关键词搜索：匹配标题、位置、描述
      if (keyword) {
        const kw = keyword.toLowerCase()
        if (!(r.title || '').toLowerCase().includes(kw) &&
            !(r.location || '').toLowerCase().includes(kw) &&
            !(r.description || '').toLowerCase().includes(kw)) return false
      }
      // 教师角色只能看到自己提交的记录
      if (req.user.role === 'teacher' && r.reporter_id !== req.user.id) return false
      return true
    }

    let records = query('maintenance_records', filter)
    // 排序：按优先级（紧急>高>中>低）→ 按创建时间倒序
    records.sort((a, b) => {
      const pOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const pDiff = (pOrder[a.priority] || 9) - (pOrder[b.priority] || 9)
      if (pDiff !== 0) return pDiff
      return (b.created_at || '').localeCompare(a.created_at || '')
    })

    // 分页
    const total = records.length
    const p = parseInt(page)
    const ps = parseInt(pageSize)
    records = records.slice((p - 1) * ps, p * ps)

    res.json({ code: 200, data: { list: records, total, page: p, pageSize: ps } })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// GET /api/maintenance/detail/:id - 获取维修记录详情
router.get('/detail/:id', authMiddleware, async (req, res) => {
  try {
    const record = findById('maintenance_records', parseInt(req.params.id))
    if (!record) return res.json({ code: 404, message: '记录不存在' })
    res.json({ code: 200, data: record })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// POST /api/maintenance/create - 创建维修记录
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const {
      title, description, location, building, floor, room,
      category, priority, model_element_id, model_element_name, model_name, images,
      repair_start_date, repair_end_date
    } = req.body
    const record = insert('maintenance_records', {
      title, description, location, building, floor, room,
      category, priority: priority || 'medium',
      status: 'pending',
      reporter_id: req.user.id,
      reporter_name: req.user.real_name,
      model_element_id: model_element_id || null,
      model_element_name: model_element_name || null,
      model_name: model_name || null,
      handler_id: null, handler_name: null,
      repair_start_date: repair_start_date || null,
      repair_end_date: repair_end_date || null,
      images: images || null,
      completed_at: null
    })
    res.json({ code: 200, message: '维修成功', data: { id: record.id } })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// PUT /api/maintenance/update/:id - 更新维修记录（状态流转、分配处理人等）
router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const record = findById('maintenance_records', id)
    if (!record) return res.json({ code: 404, message: '记录不存在' })

    const updates = {}
    const { status, handler_id, handler_name, description, priority, images, title, location, building, floor, room, category, model_element_id, model_element_name, model_name, repair_start_date, repair_end_date } = req.body
    if (status !== undefined) {
      updates.status = status
      if (status === 'completed') updates.completed_at = new Date().toISOString()
    }
    if (handler_id !== undefined) updates.handler_id = handler_id
    if (handler_name !== undefined) updates.handler_name = handler_name
    if (description !== undefined) updates.description = description
    if (priority !== undefined) updates.priority = priority
    if (images !== undefined) updates.images = images
    if (title !== undefined) updates.title = title
    if (location !== undefined) updates.location = location
    if (building !== undefined) updates.building = building
    if (floor !== undefined) updates.floor = floor
    if (room !== undefined) updates.room = room
    if (category !== undefined) updates.category = category
    if (model_element_id !== undefined) updates.model_element_id = model_element_id
    if (model_element_name !== undefined) updates.model_element_name = model_element_name
    if (model_name !== undefined) updates.model_name = model_name
    if (repair_start_date !== undefined) updates.repair_start_date = repair_start_date
    if (repair_end_date !== undefined) updates.repair_end_date = repair_end_date

    if (Object.keys(updates).length === 0) {
      return res.json({ code: 400, message: '没有需要更新的字段' })
    }

    update('maintenance_records', id, updates)
    res.json({ code: 200, message: '更新成功' })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// DELETE /api/maintenance/delete/:id - 删除维修记录
router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    remove('maintenance_records', parseInt(req.params.id))
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// GET /api/maintenance/by-element/:elementId - 根据 BIM 构件 ID 查询关联的维修记录
router.get('/by-element/:elementId', authMiddleware, async (req, res) => {
  try {
    const records = query('maintenance_records', r => r.model_element_id === req.params.elementId)
    records.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    res.json({ code: 200, data: records })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

// GET /api/maintenance/statistics - 获取维修统计数据（用于仪表盘）
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const all = query('maintenance_records')
    const total = all.length
    const pending = all.filter(r => r.status === 'pending').length
    const processing = all.filter(r => r.status === 'processing').length
    const completed = all.filter(r => r.status === 'completed').length

    // 按分类统计
    const catMap = {}
    all.forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + 1 })
    const byCategory = Object.entries(catMap).map(([category, count]) => ({ category, count }))

    // 按优先级统计
    const priMap = {}
    all.forEach(r => { priMap[r.priority] = (priMap[r.priority] || 0) + 1 })
    const byPriority = Object.entries(priMap).map(([priority, count]) => ({ priority, count }))

    // 最近 10 条记录
    const recent = [...all].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 10)
      .map(r => ({ id: r.id, title: r.title, status: r.status, priority: r.priority, created_at: r.created_at }))

    res.json({ code: 200, data: { total, pending, processing, completed, byCategory, byPriority, recent } })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

module.exports = router
