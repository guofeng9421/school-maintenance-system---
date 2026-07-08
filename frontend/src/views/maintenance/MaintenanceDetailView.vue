<template>
  <div class="page-container">
    <el-card shadow="never" v-loading="loading">
      <div slot="header" style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:18px;font-weight:600;">报修详情 #{{ record.id }}</span>
        <div>
          <el-button size="small" @click="$router.back()">返回列表</el-button>
          <el-button size="small" type="primary" @click="$router.push(`/maintenance/edit/${record.id}`)">编辑</el-button>
        </div>
      </div>

      <el-row :gutter="24">
        <el-col :span="16">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="报修标题" :span="2">{{ record.title }}</el-descriptions-item>
            <el-descriptions-item label="报修位置">{{ record.location }}</el-descriptions-item>
            <el-descriptions-item label="楼栋">{{ record.building }}</el-descriptions-item>
            <el-descriptions-item label="楼层">{{ record.floor }}</el-descriptions-item>
            <el-descriptions-item label="房间">{{ record.room }}</el-descriptions-item>
            <el-descriptions-item label="分类">
              <el-tag>{{ categoryMap[record.category] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="priorityType[record.priority]">{{ priorityMap[record.priority] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType[record.status]">{{ statusMap[record.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="报修人">{{ record.reporter_name }}</el-descriptions-item>
            <el-descriptions-item label="报修时间">{{ formatDate(record.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{ record.handler_name || '待分配' }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ record.completed_at ? formatDate(record.completed_at) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="问题描述" :span="2">{{ record.description || '无' }}</el-descriptions-item>
            <!-- 现场图片：有图片时显示缩略图，点击可预览大图 -->
            <el-descriptions-item label="现场图片" :span="2" v-if="record.images && record.images.length">
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                <el-image v-for="(img, idx) in record.images" :key="idx" :src="img" :preview-src-list="record.images" fit="cover" style="width:100px;height:100px;border-radius:4px;" />
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="关联模型构件" :span="2">
              <el-tag v-if="record.model_element_id" type="success">
                {{ record.model_element_name || record.model_element_id }}
                <!-- 点击跳转到 BIM 页面，传递 elementId 用于自动定位构件 -->
                <el-button type="text" size="small" @click="$router.push({ path: '/bim', query: { model_element_id: record.model_element_id } })" style="margin-left:8px;">查看模型</el-button>
              </el-tag>
              <span v-else style="color:#909399;">未关联</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
        <el-col :span="8">
          <el-card shadow="never" style="margin-bottom:16px;">
            <div slot="header"><span>状态流转</span></div>
            <el-steps direction="vertical" :active="activeStep" finish-status="success" style="height: 260px;">
              <el-step title="提交报修" :description="formatDate(record.created_at)" />
              <el-step title="处理中" :description="record.status !== 'pending' ? '已分配' : '待处理'" />
              <el-step title="已完成" :description="record.completed_at ? formatDate(record.completed_at) : ''" />
            </el-steps>
          </el-card>
          <el-card shadow="never">
            <div slot="header"><span>快速操作</span></div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <el-button v-if="record.status === 'pending'" type="warning" @click="showHandlerDialog = true">开始处理</el-button>
              <el-button v-if="record.status === 'processing'" type="success" @click="changeStatus('completed')">标记完成</el-button>
              <el-button v-if="record.status === 'pending'" type="danger" @click="changeStatus('rejected')">驳回</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-dialog title="开始处理" :visible.sync="showHandlerDialog" width="400px">
      <el-form :model="handlerForm" label-width="80px" @submit.native.prevent="confirmStartProcessing">
        <el-form-item label="处理人">
          <el-input v-model="handlerForm.handler_name" placeholder="请输入处理人姓名" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showHandlerDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmStartProcessing">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  categoryMap,
  priorityMap,
  statusMap,
  statusType,
  priorityType,
} from "../../config/constants";
import { formatDate } from "../../utils";

export default {
  name: "MaintenanceDetailView",
  data() {
    return {
      loading: true,
      record: {
        id: "",
        title: "",
        description: "",
        location: "",
        building: "",
        floor: "",
        room: "",
        category: "other",
        priority: "medium",
        status: "pending",
        reporter_name: "",
        handler_name: "",
        created_at: "",
        completed_at: "",
        model_element_id: "",
        model_element_name: "",
        images: [],
      },
      categoryMap,
      priorityMap,
      statusMap,
      statusType,
      priorityType,
      showHandlerDialog: false,
      handlerForm: {
        handler_name: "",
      },
    };
  },
  computed: {
    activeStep() {
      const map = { pending: 0, processing: 1, completed: 2, rejected: 0 };
      return map[this.record.status] !== undefined
        ? map[this.record.status]
        : 0;
    },
  },
  mounted() {
    this.fetchDetail();
  },
  activated() {
    this.fetchDetail();
  },
  methods: {
    formatDate,
    async fetchDetail() {
      this.loading = true;
      try {
        const res = await this.$API.maintenanceApi.getDetail(
          this.$route.params.id
        );
        if (res.code === 200) {
          Object.assign(this.record, res.data);
        }
      } finally {
        this.loading = false;
      }
    },
    async changeStatus(status) {
      const statusLabel = {
        processing: "处理中",
        completed: "已完成",
        rejected: "已驳回",
      };
      const res = await this.$API.maintenanceApi.update(this.$route.params.id, {
        status,
      });
      if (res.code === 200) {
        this.$message.success(`已标记为${statusLabel[status]}`);
      }
      this.fetchDetail();
    },
    async confirmStartProcessing() {
      if (!this.handlerForm.handler_name.trim()) {
        this.$message.warning("请输入处理人姓名");
        return;
      }
      const res = await this.$API.maintenanceApi.update(this.$route.params.id, {
        status: "processing",
        handler_name: this.handlerForm.handler_name,
      });
      if (res.code === 200) {
        this.$message.success(res.message);
      }
      this.showHandlerDialog = false;
      this.handlerForm.handler_name = "";
      this.fetchDetail();
    },
  },
};
</script>
