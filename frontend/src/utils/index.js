// 格式化日期为中文本地化字符串
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 格式化日期为年月日（不含时分秒）
export function formatDateOnly(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
