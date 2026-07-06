import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import router from './router'
import store from './store'
import API from './api'              // 导入中央汇总的 API 模块
import './styles/global.scss'

// 注册 Element UI 组件库（默认尺寸 small）
Vue.use(ElementUI, { size: 'small', zIndex: 3000 })

Vue.config.productionTip = false

// 全局挂载 API：组件中通过 this.$API.xxxApi.method() 调用，无需 import
Vue.prototype.$API = API

// 创建 Vue 实例，挂载到 #app
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
