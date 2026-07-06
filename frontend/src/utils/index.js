// 格式化日期为中文本地化字符串
export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}
