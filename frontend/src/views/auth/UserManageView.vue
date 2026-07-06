<template>
  <div class="page-container">
    <el-card shadow="never">
      <div slot="header" style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:18px;font-weight:600;">用户管理</span>
        <el-button type="success" @click="handleAdd">
          <i class="el-icon-plus"></i> 新增用户
        </el-button>
      </div>
      <el-table :data="users" stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="real_name" label="真实姓名"/>
        <el-table-column prop="role" label="角色" >
          <template slot-scope="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : row.role === 'maintenance' ? 'warning' : ''">
              {{ roleMap[row.role] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="created_at" label="注册时间" width="170">
          <template slot-scope="{ row }">{{ row.created_at ? formatDate(row.created_at) : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template slot-scope="{ row }">
            <el-button type="text" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确认删除该用户?" @confirm="handleDelete(row.id)">
              <el-button slot="reference" type="text" size="small" style="color:#f56c6c;">删除</el-button>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="isEdit ? '编辑用户' : '新增用户'" :visible.sync="dialogVisible" width="450px">
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item :label="isEdit ? '新密码' : '密码'" :prop="isEdit ? '' : 'password'">
          <el-input v-model="form.password" type="password" :placeholder="isEdit ? '留空则不修改' : '请输入密码'" show-password />
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="form.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width:100%">
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
            <el-option label="维修人员" value="maintenance" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { roleMap } from '../../config/constants'
import { formatDate } from '../../utils'

export default {
  name: 'UserManageView',
  data() {
    return {
      users: [],
      loading: false,
      roleMap,
      dialogVisible: false,
      isEdit: false,
      submitting: false,
      editId: null,
      form: { username: '', password: '', real_name: '', phone: '', role: 'teacher' },
      rules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [{ required: true, message: '请输入密码', trigger: ['blur', 'submit'] }],
        real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
        role: [{ required: true, message: '请选择角色', trigger: 'change' }]
      }
    }
  },
  mounted() {
    this.fetchUsers()
  },
  methods: {
    formatDate,
    async fetchUsers() {
      this.loading = true
      try {
        const res = await this.$API.authApi.getUsers()
        if (res.code === 200) {
          this.users = res.data
        }
      } finally {
        this.loading = false
      }
    },
    handleAdd() {
      this.isEdit = false
      this.editId = null
      this.form = { username: '', password: '', real_name: '', phone: '', role: 'teacher' }
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.isEdit = true
      this.editId = row.id
      this.form = { username: row.username, password: '', real_name: row.real_name, phone: row.phone, role: row.role }
      this.dialogVisible = true
    },
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return
        this.submitting = true
        try {
          if (this.isEdit) {
            const data = {username: this.form.username, real_name: this.form.real_name, phone: this.form.phone, role: this.form.role }
            if (this.form.password) data.password = this.form.password
            const res = await this.$API.authApi.updateUser(this.editId, data)
            this.$message.success(res.message)
          } else {
            const res = await this.$API.authApi.addUser(this.form)
            this.$message.success(res.message)
          }
          this.dialogVisible = false
          this.fetchUsers()
        } catch (e) {
          this.$message.error(e)
        } finally {
          this.submitting = false
        }
      })
    },
    async handleDelete(id) {
     const res = await this.$API.authApi.deleteUser(id)
      this.$message.success(res.message)
      this.fetchUsers()
    }
  }
}
</script>
