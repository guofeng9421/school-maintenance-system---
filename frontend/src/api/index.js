// 中央汇总：将各模块 API 统一导出，供 main.js 挂载到 Vue.prototype.$API
import * as authApi from './auth'
import * as maintenanceApi from './maintenance'
import * as bimfaceApi from './bimface'


export default { authApi, maintenanceApi, bimfaceApi, }
