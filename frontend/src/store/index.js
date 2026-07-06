import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'

Vue.use(Vuex)

// Vuex 全局状态管理：注册 user 模块
export default new Vuex.Store({
  modules: {
    user  // 用户状态模块（登录/登出/用户信息）
  }
})
