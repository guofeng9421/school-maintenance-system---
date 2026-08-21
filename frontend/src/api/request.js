import axios from 'axios'
import { Message } from 'element-ui'
import router from '@/router'

// 创建 axios 实例，基础路径 /api 由 devServer 代理到后端
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：自动携带 JWT token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一处理业务错误和 HTTP 错误
request.interceptors.response.use(
  response => {
    const { data } = response
    // 业务层 401：token 过期，清除登录状态并跳转登录页
    if (data.code === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
      Message.error('登录已过期，请重新登录')
      return Promise.reject(data)
    }
    return data
  },
  error => {
    // 忽略被取消的请求（页面切换时旧请求取消）
    if (axios.isCancel(error)) return Promise.reject(error)
    // HTTP 401：服务器返回 401 状态码，同样清除登录状态
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
      Message.error('登录已过期，请重新登录')
    } else {
      Message.error(error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
