const fs = require('fs')
const path = require('path')

// JSON 文件数据库配置
const DB_DIR = path.join(__dirname, '..', 'data')
const DB_FILE = path.join(DB_DIR, 'db.json')

// 确保 data 目录存在
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

// 读取数据库（JSON 文件）
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    // 初始化空数据库结构
    const init = { users: [], maintenance_records: [], model_elements: [], _counters: { users: 0, maintenance_records: 0 } }
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2), 'utf-8')
    return init
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
}

// 写入数据库
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// 查询表数据，可传入过滤函数
function query(table, filterFn) {
  const db = readDB()
  const rows = db[table] || []
  return filterFn ? rows.filter(filterFn) : rows
}

// 根据 ID 查找单条记录
function findById(table, id) {
  const db = readDB()
  return (db[table] || []).find(r => r.id === id)
}

// 插入记录（自动生成 ID 和时间戳）
function insert(table, record) {
  const db = readDB()
  if (!db[table]) db[table] = []
  if (!db._counters) db._counters = {}
  db._counters[table] = (db._counters[table] || 0) + 1
  record.id = db._counters[table]
  record.created_at = record.created_at || new Date().toISOString()
  record.updated_at = record.updated_at || new Date().toISOString()
  db[table].push(record)
  writeDB(db)
  return record
}

// 更新记录（自动更新 updated_at）
function update(table, id, updates) {
  const db = readDB()
  const idx = (db[table] || []).findIndex(r => r.id === id)
  if (idx === -1) return false
  Object.assign(db[table][idx], updates, { updated_at: new Date().toISOString() })
  writeDB(db)
  return db[table][idx]
}

// 删除记录
function remove(table, id) {
  const db = readDB()
  const idx = (db[table] || []).findIndex(r => r.id === id)
  if (idx === -1) return false
  db[table].splice(idx, 1)
  writeDB(db)
  return true
}

// 统计记录数量
function count(table, filterFn) {
  const rows = query(table, filterFn)
  return rows.length
}

module.exports = { readDB, writeDB, query, findById, insert, update, remove, count }
