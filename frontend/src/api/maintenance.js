// 维修记录相关接口：CRUD + 统计 + 图片上传
import request from './request'

// 获取维修记录列表（分页+筛选）
export const getList = (params) => request.get('/maintenance/list', { params })

// 获取维修记录详情
export const getDetail = (id) => request.get(`/maintenance/detail/${id}`)

// 新建维修
export const create = (data) => request.post('/maintenance/create', data)

// 维修分类
export const getRepair = () => request.get('/category/repair');

// 维修子类
export const getRepairSub = repairCategoryId => request.get(`/category/repair/sub/${repairCategoryId}`);

// 更新维修记录
export const update = (id, data) => request.put(`/maintenance/update/${id}`, data)

// 删除维修记录
export const remove = (id) => request.delete(`/maintenance/delete/${id}`)

// 按BIM构件ID查询关联维修记录
export const getByElement = (elementId) => request.get(`/maintenance/by-element/${elementId}`)

// 获取维修统计数据（用于仪表盘）
export const getStatistics = () => request.get('/maintenance/statistics')

// 上传图片（返回图片URL数组）
export const uploadImages = (formData) => request.post('/maintenance/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 30000  // 上传超时30秒
})
