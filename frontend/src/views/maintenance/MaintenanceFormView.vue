<template>
  <div class="page-container">
    <el-card shadow="never">
      <div slot="header" style="font-size: 18px; font-weight: 600;">{{ isEdit ? '编辑维修' : '新建维修' }}</div>
      <el-form ref="form" :model="form" :rules="rules" label-width="110px" style="max-width: 800px;">
        <el-form-item label="维修标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入维修标题" :disabled="!hasComponent" />
        </el-form-item>
        <el-form-item label="维修大类" prop="category">
          <el-select v-model="form.category" placeholder="请选择大类" style="width:100%" :disabled="!hasComponent" @change="handleCategoryChange">
            <el-option :label="item.name" :value="item.name" v-for="item in category" :key="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="维修子类" prop="sub_category">
          <el-select v-model="form.sub_category" multiple placeholder="请选择子类（可多选）" style="width:100%" :disabled="!hasComponent || !form.category">
            <el-option :label="item.name" :value="item.name" v-for="item in subCategory" :key="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="维修位置" prop="location">
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
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="维修公司" prop="handler_name">
              <el-input v-model="form.handler_name" placeholder="请输入维修公司名称" :disabled="!hasComponent" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始维修时间" prop="assigned_at">
              <el-date-picker v-model="form.assigned_at" type="date" placeholder="选择开始日期" value-format="yyyy-MM-dd" style="width:100%" :disabled="!hasComponent" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维修结束时间" prop="completed_at">
              <el-date-picker v-model="form.completed_at" type="date" placeholder="选择结束日期" value-format="yyyy-MM-dd" style="width:100%" :disabled="!hasComponent" :picker-options="pickerOptions" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="问题描述">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请详细描述问题..." :disabled="!hasComponent" />
        </el-form-item>

        <!-- 图片上传：手动上传模式，提交表单时统一上传 -->
        <el-form-item label="上传现场照片">
          <el-upload action="#" :auto-upload="false" :file-list="fileList" :on-change="handleFileChange" :on-remove="handleFileRemove" accept="image/*" :limit="9" list-type="picture-card" :disabled="!hasComponent">
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">最多上传9张图片，单张不超过10MB</div>
          </el-upload>
        </el-form-item>

        <el-divider content-position="left">BIM模型关联</el-divider>

        <el-row :gutter="10">
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
          <el-button type="primary" :loading="submitting" :disabled="!hasComponent" @click="handleSubmit">{{ isEdit ? '更新' : '提交维修' }}</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
// 新建/编辑维修表单页面
export default {
  name: "MaintenanceFormView",
  data() {
    return {
      submitting: false, // 提交按钮loading状态
      category: [], // 维修分类列表
      subCategory: [], // 维修子分类列表
      fileList: [], // el-upload组件的文件列表（包含新选择的文件和已有图片）
      // 维修表单数据
      // 从 BIM 页面跳转时，以下字段会通过 query 参数自动填充：
      // model_element_id、model_element_name、floor、room、model_name
      form: {
        title: "",
        description: "",
        location: "",
        building: "",
        floor: "",
        room: "",
        category: "",
        sub_category: [],
        model_element_id: "",
        model_element_name: "",
        model_name: "",
        handler_name: "",
        assigned_at: "",
        completed_at: "",
        status: "processing",
        images: [],
      },
      // 表单验证规则
      rules: {
        title: [{ required: true, message: "请输入维修标题", trigger: "blur" }],
        location: [
          { required: true, message: "请输入维修位置", trigger: "blur" },
        ],
        building: [{ required: true, message: "请输入楼栋", trigger: "blur" }],
        category: [{ required: true, message: "请选择大类", trigger: "blur" }],
        sub_category: [
          { required: true, message: "请选择子类", trigger: "blur" },
        ],
        handler_name: [
          { required: true, message: "请输入维修公司", trigger: "blur" },
        ],
        assigned_at: [
          { required: true, message: "请选择开始维修时间", trigger: "blur" },
        ],
        completed_at: [
          { required: true, message: "请选择维修结束时间", trigger: "blur" },
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
    },
    // 控制结束日期选择器的可选范围，禁止选择早于开始日期的时间
    pickerOptions() {
      return {
        disabledDate: (time) => {
          if (!this.form.assigned_at) return false;
          const [y, m, d] = this.form.assigned_at.split("-").map(Number);
          const startDate = new Date(y, m - 1, d).getTime();
          return time.getTime() < startDate;
        },
      };
    },
  },
  mounted() {
    // 首次加载：编辑模式下拉取详情
    if (this.isEdit) {
      this.fetchDetail();
      this.fetchRepairCategories();
    } else {
      this.fetchRepairCategories();
    }

    // 从 BIM 页面跳转过来时，读取 query 参数自动填充表单
    if (this.$route.query.model_element_id) {
      this.fillComponentFromQuery(this.$route.query);
    }
  },
  watch: {
    $route(to, from) {
      // 从 BIM 页面返回，读取 query 参数更新构件信息，跳过 fetchDetail
      if (to.query.model_element_id) {
        this.fillComponentFromQuery(to.query);
      } else if (to.params.id && (!from || to.params.id !== from.params.id)) {
        this.fetchDetail();
      }
    },
    "form.assigned_at"(newVal) {
      if (this.form.completed_at && newVal) {
        const [y, m, d] = newVal.split("-").map(Number);
        const startDate = new Date(y, m - 1, d).getTime();
        const [y2, m2, d2] = this.form.completed_at.split("-").map(Number);
        const endDate = new Date(y2, m2 - 1, d2).getTime();
        if (endDate < startDate) {
          this.form.completed_at = "";
        }
      }
    },
  },
  methods: {
    // 从 query 参数填充构件信息
    fillComponentFromQuery(query) {
      this.form.model_element_id = query.model_element_id;
      this.form.model_element_name = query.model_element_name;
      this.form.floor = query.floor.split("-")[1] || query.floor;
      this.form.room = query.room || "";
      this.form.model_name = query.model_name || "";
      this.form.building = query.model_name.split(".")[0]; // 如果 BIM 页面没有传楼栋信息，则默认使用模型名称
      this.form.location = `${this.form.building} ${this.form.floor} ${this.form.room}`;
    },
    // 编辑模式：从后端获取已有维修记录数据并填充表单
    async fetchDetail() {
      const res = await this.$API.maintenanceApi.getDetail(
        this.$route.params.id
      );
      console.log("获取维修详情:", res);
      if (res.code === 200) {
        const savedSubCategory = res.data.sub_category || [];
        Object.assign(this.form, {
          title: res.data.title,
          description: res.data.description,
          location: res.data.location,
          building: res.data.building,
          floor: res.data.floor,
          room: res.data.room,
          category: res.data.category,
          sub_category: res.data.sub_category,
          priority: res.data.priority,
          model_element_id: res.data.model_element_id || "",
          model_element_name: res.data.model_element_name || "",
          model_name: res.data.model_name || "",
          handler_name: res.data.handler_name || "",
          assigned_at: res.data.assigned_at || "",
          completed_at: res.data.completed_at || "",
          images: res.data.images || [],
        });
        // 编辑模式下，如果有大类则加载子分类
        if (this.form.category) {
          await this.handleCategoryChange(this.form.category);
        }
        this.form.sub_category = savedSubCategory; // 恢复子类选中值
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
        query.from = "edit";
        query.record_id = this.$route.params.id;
      }
      this.$router.push({ path: "/bim", query });
    },
    // 文件选择变更回调：同步更新fileList
    handleFileChange(file, list) {
      this.fileList = list;
    },
    // 文件移除回调：同步更新fileList
    handleFileRemove(file, list) {
      console.log("文件移除:", file, list);
      this.fileList = list;
      // 如果是已上传的旧图片（没有raw属性），从form.images中移除
      if (!file.raw && file.url) {
        this.form.images = this.form.images.filter((url) => url !== file.url);
      }
    },
    // 提交表单：先校验 → 上传图片 → 提交维修数据
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
          // 提交维修数据（新建或更新）
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
          console.log("提交维修数据:", submitData);
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
    // 获取维修分类列表（用于下拉选择），并缓存到组件data中
    async fetchRepairCategories() {
      try {
        const res = await this.$API.maintenanceApi.getRepair();
        if (res.code === 200) {
          this.category = res.data;
        }
      } catch (e) {
        console.error("获取维修分类失败:", e);
      }
    },
    // 大类变更时获取子分类列表
    async handleCategoryChange(categoryId) {
      this.form.sub_category = "";
      this.subCategory = [];
      if (!categoryId) return;
      try {
        const res = await this.$API.maintenanceApi.getRepairSub(categoryId);
        if (res.code === 200) {
          this.subCategory = res.data;
        }
      } catch (e) {
        console.error("获取维修子类失败:", e);
      }
    },
  },
};
</script>
