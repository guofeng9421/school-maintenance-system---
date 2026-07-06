// BIMface相关接口：获取模型列表
import request from './request'

// // 获取模型列表（含viewToken）模拟后端
export const getModels = () => request.get('/bimface/models')
// 获取模型列表（含viewToken）实际的接口
// export const getModels = () => request.get('bim/all-view-tokens')
