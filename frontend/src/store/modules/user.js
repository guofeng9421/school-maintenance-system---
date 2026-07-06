import { login } from '../../api/auth'

// 用户状态管理（Vuex module）
const state = {
  token: localStorage.getItem('token') || '',        // JWT token
  user: JSON.parse(localStorage.getItem('user') || 'null') // 用户信息（id/username/real_name/role/phone）
}

const getters = {
  isLoggedIn: state => !!state.token,                // 是否已登录
  isAdmin: state => state.user && state.user.role === 'admin',       // 是否管理员
  isMaintenance: state => state.user && state.user.role === 'maintenance' // 是否维修人员
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
  },
  SET_USER(state, user) {
    state.user = user
  },
  CLEAR_AUTH(state) {
    state.token = ''
    state.user = null
  }
}

const actions = {
  // 登录：调用后端 API，成功后存储 token 和用户信息到 localStorage
  async login({ commit }, { username, password }) {
    const res = await login({ username, password })
    if (res.code === 200) {
      commit('SET_TOKEN', res.data.token)
      commit('SET_USER', res.data.user)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
    return res
  },
  // 退出登录：清除状态和 localStorage
  logout({ commit }) {
    commit('CLEAR_AUTH')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
