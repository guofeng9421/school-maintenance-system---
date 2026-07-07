import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 路由配置表：包含登录/注册独立页面和 Layout 布局下的子页面
const routes = [
  // 登录页：独立页面，不使用 Layout 布局
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue')
  },
  // 注册页：独立页面，不使用 Layout 布局
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue')
  },
  // 主布局：包含侧边栏和顶栏，所有功能页面作为子路由嵌套在内
  {
    path: '/',
    component: () => import('../views/LayoutView.vue'),
    redirect: '/dashboard',  // 默认重定向到数据看板
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/DashboardView.vue'),
        meta: { title: '数据看板' }
      },
      {
        path: 'bim',
        name: 'BimModel',
        component: () => import('../views/bim/BimModelView.vue'),
        meta: { title: 'BIM模型' }
      },
      {
        path: 'maintenance',
        name: 'MaintenanceList',
        component: () => import('../views/maintenance/MaintenanceListView.vue'),
        meta: { title: '维修记录' }
      },
      {
        path: 'maintenance/create',
        name: 'MaintenanceCreate',
        component: () => import('../views/maintenance/MaintenanceFormView.vue'),
        meta: { title: '新建报修' }
      },
      {
        path: 'maintenance/edit/:id',
        name: 'MaintenanceEdit',
        component: () => import('../views/maintenance/MaintenanceFormView.vue'),
        meta: { title: '编辑报修' }
      },
      {
        path: 'maintenance/detail/:id',
        name: 'MaintenanceDetail',
        component: () => import('../views/maintenance/MaintenanceDetailView.vue'),
        meta: { title: '维修详情' }
      },
      {
        path: 'users',
        name: 'UserManage',
        component: () => import('../views/auth/UserManageView.vue'),
        meta: { title: '用户管理', requiresAdmin: true }  // requiresAdmin: 仅管理员可访问
      }
    ]
  },
  // 404 兜底：访问不存在的路径时重定向到首页
  { path: '*', redirect: '/' }
]

// 创建路由实例，使用 history 模式（URL 不带 #）
const router = new VueRouter({
  mode: 'history',
  routes
})

// 覆盖 push 方法，捕获重复导航错误
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => {
    if (err && err.name !== 'NavigationDuplicated') throw err
  })
}

// 全局路由守卫：未登录时跳转到登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  // 登录页和注册页放行，其他页面需要 token
  if (to.path !== '/login' && to.path !== '/register' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
