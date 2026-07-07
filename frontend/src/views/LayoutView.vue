<template>
  <div class="layout-container">
    <el-container style="height: 100vh;">
      <el-aside width="220px" class="layout-aside">
        <div class="logo">
          <i class="el-icon-setting" style="font-size: 24px;"></i>
          <span>维修管理系统</span>
        </div>
        <el-menu :default-active="activeMenu" router background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff">
          <el-menu-item index="/dashboard">
            <i class="el-icon-data-line"></i>
            <span>数据看板</span>
          </el-menu-item>
          <el-menu-item index="/bim">
            <i class="el-icon-view"></i>
            <span>BIM模型</span>
          </el-menu-item>
          <el-menu-item index="/maintenance">
            <i class="el-icon-document"></i>
            <span>维修记录</span>
          </el-menu-item>
          <el-menu-item index="/maintenance/create">
            <i class="el-icon-plus"></i>
            <span>新建报修</span>
          </el-menu-item>
          <el-menu-item v-if="isAdmin" index="/users">
            <i class="el-icon-user"></i>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header class="layout-header">
          <div class="header-left">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-if="$route.meta.title">{{ $route.meta.title }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-dropdown trigger="click">
              <span class="user-info">
                <el-avatar :size="32" style="background:#409eff">
                  {{ user && user.real_name ? user.real_name.charAt(0) : '' }}
                </el-avatar>
                <span class="user-name">{{ user ? user.real_name : '' }}</span>
                <span class="user-role">{{ roleMap[user ? user.role : ''] }}</span>
              </span>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </el-header>
        <el-main class="layout-main">
          <keep-alive>
            <router-view v-if="this.$route.params.id"/>
          </keep-alive>
          <router-view v-if="!this.$route.params.id"/>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { roleMap } from "../config/constants";

// 主布局组件：包含左侧导航栏 + 顶部栏 + 内容区域
export default {
  name: "LayoutView",
  data() {
    return { roleMap };
  },
  computed: {
    // 当前激活的菜单项：维修相关页面统一高亮"维修记录"菜单
    activeMenu() {
      const path = this.$route.path;
      if (path.startsWith("/maintenance")) return "/maintenance";
      return path;
    },
    // 当前登录用户信息（从 Vuex store 获取）
    user() {
      return this.$store.state.user.user;
    },
    // 是否为管理员角色（控制"用户管理"菜单的显示）
    isAdmin() {
      return this.$store.getters["user/isAdmin"];
    },
  },
  methods: {
    // 退出登录：清除状态并跳转到登录页
    handleLogout() {
      this.$store.dispatch("user/logout");
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped lang="scss">
.layout-aside {
  background: #304156;
  overflow-y: auto;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #3a4a5c;
}
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
.header-right {
  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  .user-name {
    font-size: 14px;
    color: #303133;
  }
  .user-role {
    font-size: 12px;
    color: #909399;
  }
}
.layout-main {
  background: #f0f2f5;
  padding: 20px;
  overflow: auto;
}
</style>
