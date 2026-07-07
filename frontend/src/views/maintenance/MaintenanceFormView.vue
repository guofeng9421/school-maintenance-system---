<template>
  <div class="page-container">
    <el-card shadow="never">
      <div slot="header" style="font-size: 18px; font-weight: 600;">{{ isEdit ? '编辑报修' : '新建报修' }}</div>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" style="max-width: 800px;">
        <el-form-item label="报修标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入报修标题" :disabled="!hasComponent" />
        </el-form-item>
        <el-form-item label="报修位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入详细位置，如：教学楼A 301教室" :disabled="!hasComponent" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="楼栋" prop="building">
              <el-input v-model="form.building" placeholder="如：教学楼A" :disabled="!hasComponent" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="楼层">
              <el-input v-model="form.floor" placeholder="如：3层" :disabled="!hasComponent" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="房间号">
              <el-input v-model="form.room" placeholder="如：301" :disabled="!hasComponent" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="报修分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择" style="width:100%" :disabled="!hasComponent">
            <el-option label="电气" value="electrical" />
            <el-option label="水暖" value="plumbing" />
            <el-option label="家具" value="furniture" />
            <el-option label="门窗" value="door_window" />
            <el-option label="地面" value="floor" />
            <el-option label="墙面" value="wall" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-radio-group v-model="form.priority" :disabled="!hasComponent">
            <el-radio-button label="low">低</el-radio-button>
            <el-radio-button label="medium">中</el-radio-button>
            <el-radio-button label="high">高</el-radio-button>
            <el-radio-button label="urgent">紧急</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述问题..." :disabled="!hasComponent" />
        </el-form-item>

        <!-- 图片上传：手动上传模式，提交表单时统一上传 -->
        <el-form-item label="上传图片">
          <el-upload action="#" :auto-upload="false" :file-list="fileList" :on-change="handleFileChange" :on-remove="handleFileRemove" accept="image/*" :limit="9" list-type="picture-card" :disabled="!hasComponent">
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">最多上传9张图片，单张不超过10MB</div>
          </el-upload>
        </el-form-item>

        <el-divider content-position="left">BIM模型关联</el-divider>

        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="构件名称">
              <el-input v-model="form.model_element_name" placeholder="点击BIM模型选择构件或手动输入" readonly>
                <el-button slot="append" @click="goSelectComponent">选择构件</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="构件ID">
              <el-input v-model="form.model_element_id" placeholder="构件ID" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="所属模型">
              <el-input v-model="form.model_name" placeholder="所属模型" readonly />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" :loading="submitting" :disabled="!hasComponent" @click="handleSubmit">{{ isEdit ? '更新' : '提交报修' }}</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
// 新建/编辑报修表单页面
export default {
  name: "MaintenanceFormView",
  data() {
    return {
      submitting: false, // 提交按钮loading状态
      fileList: [], // el-upload组件的文件列表（包含新选择的文件和已有图片）
      // 报修表单数据
      // 从 BIM 页面跳转时，以下字段会通过 query 参数自动填充：
      // model_element_id、model_element_name、floor、room、model_name
      form: {
        title: "",
        description: "",
        location: "",
        building: "",
        floor: "",
        room: "",
        category: "other",
        priority: "medium",
        model_element_id: "",
        model_element_name: "",
        model_name: "",
        status: "pending",
        images: [], // 图片URL数组，提交后由后端返回
      },
      // 表单验证规则：所有关键字段均为必填
      rules: {
        title: [{ required: true, message: "请输入报修标题", trigger: "blur" }],
        location: [
          { required: true, message: "请输入报修位置", trigger: "blur" },
        ],
        building: [{ required: true, message: "请输入楼栋", trigger: "blur" }],
        category: [
          { required: true, message: "请选择分类", trigger: "change" },
        ],
        priority: [
          { required: true, message: "请选择优先级", trigger: "change" },
        ],
        description: [
          { required: true, message: "请输入问题描述", trigger: "blur" },
        ],
      },
    };
  },
  computed: {
    // 判断是否为编辑模式（路由参数中有id）
    isEdit() {
      return !!this.$route.params.id;
    },
    // 是否已选择BIM构件（控制其他字段是否可编辑）
    hasComponent() {
      return !!this.form.model_element_id;
    }
  },
  mounted() {
    // 从 BIM 页面跳转过来时，读取 query 参数自动填充表单
    if (this.$route.query.model_element_id) {
      this.form.model_element_id = this.$route.query.model_element_id;
      this.form.model_element_name = this.$route.query.model_element_name;
      this.form.floor = this.$route.query.floor || "";
      this.form.room = this.$route.query.room || "";
      this.form.model_name = this.$route.query.model_name || "";
    }
    // 编辑模式下加载已有数据
    if (this.isEdit) {
      this.fetchDetail();
    }
  },
  activated() {
    // 缓存组件返回时，读取 query 参数更新构件信息
    if (this.$route.query.model_element_id) {
      this.form.model_element_id = this.$route.query.model_element_id;
      this.form.model_element_name = this.$route.query.model_element_name;
      this.form.floor = this.$route.query.floor || "";
      this.form.room = this.$route.query.room || "";
      this.form.model_name = this.$route.query.model_name || "";
    }
  },
  methods: {
    // 编辑模式：从后端获取已有报修记录数据并填充表单
    async fetchDetail() {
      const res = await this.$API.maintenanceApi.getDetail(
        this.$route.params.id
      );
      if (res.code === 200) {
        Object.assign(this.form, {
          title: res.data.title,
          description: res.data.description,
          location: res.data.location,
          building: res.data.building,
          floor: res.data.floor,
          room: res.data.room,
          category: res.data.category,
          priority: res.data.priority,
          model_element_id: res.data.model_element_id || "",
          model_element_name: res.data.model_element_name || "",
          model_name: res.data.model_name || "",
          images: res.data.images || [],
        });
        // 将已有图片URL转换为el-upload组件需要的fileList格式
        if (this.form.images && this.form.images.length) {
          this.fileList = this.form.images.map((url, i) => ({
            name: String(i),
            url,
          }));
        }
      }
    },
    // 跳转到BIM页面选择构件，传递来源信息
    goSelectComponent() {
      const query = {};
      if (this.isEdit) {
        query.from = 'edit';
        query.record_id = this.$route.params.id;
      }
      this.$router.push({ path: '/bim', query });
    },
    // 文件选择变更回调：同步更新fileList
    handleFileChange(file, list) {
      this.fileList = list;
    },
    // 文件移除回调：同步更新fileList
    handleFileRemove(file, list) {
      this.fileList = list;
    },
    // 提交表单：先校验 → 上传图片 → 提交报修数据
    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return;
        // 校验图片：新选择的文件和已有图片都为空时阻止提交
        if (
          this.fileList.length === 0 &&
          (!this.form.images || this.form.images.length === 0)
        ) {
          this.$message.warning("请至少上传一张图片");
          return;
        }
        this.submitting = true;
        try {
          // 如果有新选择的文件，先上传图片获取URL
          if (this.fileList.length > 0) {
            const formData = new FormData();
            // 只上传新选择的文件（有raw属性），已有的图片不需要重复上传
            this.fileList.forEach((f) => {
              if (f.raw) formData.append("images", f.raw);
            });
            if (formData.has("images")) {
              const uploadRes = await this.$API.maintenanceApi.uploadImages(
                formData
              );
              if (uploadRes.code === 200) {
                // 合并已有图片URL和新上传的图片URL
                this.form.images = [
                  ...(this.form.images || []),
                  ...uploadRes.data,
                ];
              }
            }
          }
          // 提交报修数据（新建或更新）
          let submitData = { ...this.form };
          if (!this.isEdit) {
            const user = this.$store.state.user.user;
            if (user) {
              submitData.reporter_name = user.real_name;
              submitData.request_user_id = user.id;
            }
          }
          const res = this.isEdit
            ? await this.$API.maintenanceApi.update(
                this.$route.params.id,
                submitData
              )
            : await this.$API.maintenanceApi.create(submitData);
          console.log(res);
          if (res.code === 200) {
            this.$message.success(res.message);
            this.$router.push("/maintenance");
          } else {
            this.$message.error(res.message);
          }
        } catch (e) {
          this.$message.error(e);
        } finally {
          this.submitting = false;
        }
      });
    },
  },
};
</script>
