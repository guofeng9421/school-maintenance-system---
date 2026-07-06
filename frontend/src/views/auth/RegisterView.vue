<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">注册账号</h2>
      <el-form ref="form" :model="form" :rules="rules" label-width="0" size="large">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" prefix-icon="el-icon-user" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="el-icon-lock" show-password />
        </el-form-item>
        <el-form-item prop="real_name">
          <el-input v-model="form.real_name" placeholder="真实姓名" prefix-icon="el-icon-postcard" />
        </el-form-item>
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" prefix-icon="el-icon-phone" />
        </el-form-item>
        <el-form-item prop="role">
          <el-select v-model="form.role" placeholder="角色" style="width: 100%">
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
            <el-option label="维修人员" value="maintenance" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleRegister">注 册</el-button>
        </el-form-item>
        <div class="login-footer">
          <router-link to="/login">返回登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
// 注册页面：填写用户信息并注册新账号
export default {
  name: 'RegisterView',
  data() {
    return {
      loading: false,          // 注册按钮loading状态
      // 注册表单数据，默认角色为教师
      form: {
        username: '', password: '', real_name: '', phone: '', role: 'teacher'
      },
      // 表单验证规则
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少6位', trigger: 'blur' }
        ],
        real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }]
      }
    }
  },
  methods: {
    // 提交注册：调用后端注册接口
    handleRegister() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return
        this.loading = true
        try {
          const res = await this.$API.authApi.register(this.form)
          if (res.code === 200) {
            this.$message.success('注册成功，请登录')
            this.$router.push('/login')
          } else {
            this.$message.error(res.message)
          }
        } catch (e) {
          this.$message.error('注册失败')
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
}
.login-footer {
  text-align: center;
  a { color: #667eea; text-decoration: none; }
}
</style>
