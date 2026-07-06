<template>
  <!-- 根组件：渲染当前路由对应的视图 -->
  <router-view />
</template>

<script>
// 应用根组件，作为 Vue 实例的挂载点
export default {
  name: 'App'
}
</script>

<style>
/* 全局样式重置：清除默认边距和内边距 */
* { margin: 0; padding: 0; box-sizing: border-box; }
/* 确保 html、body、#app 高度为 100%，撑满整个视口 */
html, body, #app { height: 100%; }
</style>
