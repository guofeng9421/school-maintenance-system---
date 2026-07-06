// 认证相关接口：登录、注册、获取用户信息
import request from './request'

// 登录
export const login = (data) => request.post('/auth/login', data)

// 注册
export const register = (data) => request.post('/auth/register', data)

// 获取所有用户列表（管理员）
export const getUsers = () => request.get('/auth/users')

// 添加用户
export const addUser = (data) => request.post('/auth', data)

// 更新用户
export const updateUser = (id, data) => request.put(`/auth/${id}`, data)

// 删除用户
export const deleteUser = (id) => request.delete(`/auth/${id}`)
