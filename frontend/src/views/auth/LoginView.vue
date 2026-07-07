<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">学校维修记录管理系统</h2>
      <el-form ref="form" :model="form" :rules="rules" label-width="0" size="large">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="el-icon-user" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="el-icon-lock" show-password @keyup.enter.native="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">登 录</el-button>
        </el-form-item>
        <!-- <div class="login-footer">
          <router-link to="/register">注册账号</router-link>
        </div> -->
      </el-form>
    </div>
  </div>
</template>

<script>
// 登录页面：用户名+密码登录，成功后跳转到首页
export default {
  name: 'LoginView',
  data() {
    return {
      loading: false,                    // 登录按钮loading状态
      form: { username: '', password: '' }, // 登录表单数据
      // 表单验证规则
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
      }
    }
  },
  methods: {
    // 提交登录：调用 Vuex 的 login action
    handleLogin() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return
        this.loading = true
        try {
          const res = await this.$store.dispatch('user/login', {
            username: this.form.username,
            password: this.form.password
          })
          if (res.code === 200) {
            this.$message.success('登录成功')
            this.$router.push('/')
          } else {
            this.$message.error(res.message)
          }
        } catch (e) {
          this.$message.error('登录失败')
        } finally {
          this.loading = false
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}
.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-size: 22px;
}
.login-footer {
  text-align: center;
  a { color: #667eea; text-decoration: none; }
}
</style>
