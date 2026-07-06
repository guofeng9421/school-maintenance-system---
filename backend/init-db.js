const bcrypt = require('bcryptjs')
const { insert, query } = require('./config/db')

async function initDatabase() {
  const existing = query('users', u => u.username === 'admin')
  if (existing.length > 0) {
    console.log('数据库已初始化，跳过')
    return
  }

  const adminPassword = await bcrypt.hash('admin123', 10)
  insert('users', { username: 'admin', password: adminPassword, real_name: '系统管理员', role: 'admin', phone: '' })

  const demoPassword = await bcrypt.hash('123456', 10)
  const demoUsers = [
    { username: 'teacher1', real_name: '张老师', role: 'teacher', phone: '13800001111' },
    { username: 'teacher2', real_name: '李老师', role: 'teacher', phone: '13800002222' },
    { username: 'student1', real_name: '王同学', role: 'student', phone: '13800003333' },
    { username: 'fixer1', real_name: '赵师傅', role: 'maintenance', phone: '13800004444' },
  ]
  for (const u of demoUsers) {
    insert('users', { ...u, password: demoPassword })
  }
  console.log('数据库初始化完成! 默认管理员: admin / admin123')
}

initDatabase().catch(err => {
  console.error('初始化失败:', err.message)
  process.exit(1)
})
