<template>
  <div class="page-container">
    <el-card shadow="never" v-loading="loading">
      <div slot="header" style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:18px;font-weight:600;">维修详情 #{{ record.id }}</span>
        <div>
          <el-button size="small" @click="$router.back()">返回列表</el-button>
          <el-button size="small" type="primary" @click="$router.push(`/maintenance/edit/${record.id}`)">编辑</el-button>
        </div>
      </div>

      <el-row :gutter="24">
        <el-col :span="18">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="维修标题" :span="2">{{ record.title }}</el-descriptions-item>
            <el-descriptions-item label="维修位置">{{ record.location }}</el-descriptions-item>
            <el-descriptions-item label="楼栋">{{ record.building }}</el-descriptions-item>
            <el-descriptions-item label="楼层">{{ record.floor }}</el-descriptions-item>
            <el-descriptions-item label="房间">{{ record.room }}</el-descriptions-item>
            <el-descriptions-item label="维修分类">
              <el-tag>{{record.category}}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="维修子类">
              <el-tag v-for="item in record.sub_category" :key="item" type="info" size="small">{{ item }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusType[record.status]">{{ statusMap[record.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="提交人">{{ record.reporter_name }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatDate(record.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="维修公司">{{ record.handler_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开始维修时间">{{ formatDateOnly(record.assigned_at) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="维修结束时间">{{ formatDateOnly(record.completed_at) || '-' }}</el-descriptions-item>
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
        <el-col :span="6">
          <el-card shadow="never" style="margin-bottom:16px;">
            <div slot="header"><span>状态流转</span></div>
            <el-steps direction="vertical" :active="activeStep" finish-status="success" style="height: 260px;">
              <el-step title="提交时间" :description="formatDate(record.created_at)" />
              <el-step title="处理中" :description="record.status === 'processing' ? '已分配' : '待处理'" />
              <el-step title="已完成" :description="record.update_at ? formatDate(record.update_at) : ''" />
            </el-steps>
          </el-card>
          <el-card shadow="never" v-if="record.status === 'processing'">
            <div slot="header"><span>快速操作</span></div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <el-button v-if="record.status === 'pending'" type="warning" @click="changeStatus('processing')">开始处理</el-button>
              <el-button v-if="record.status === 'processing'" type="success" @click="changeStatus('completed')">标记完成</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script>
import {
  categoryMap,
  statusMap,
  statusType,
} from "../../config/constants";
import { formatDate, formatDateOnly } from "../../utils";

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
        status: "processing",
        reporter_name: "",
        handler_name: "",
        created_at: "",
        completed_at: "",
        assigned_at: "",
        completed_at: "",
        model_element_id: "",
        model_element_name: "",
        images: [],
        sub_category:[]
      },
      categoryMap,
      statusMap,
      statusType,
    };
  },
  computed: {
    activeStep() {
      const map = {  processing: 2, completed: 3,};
      console.log(this.record.status);
      return map[this.record.status] !== undefined
        ? map[this.record.status]
        : 2;
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
    formatDateOnly,
    async fetchDetail() {
      this.loading = true;
      try {
        const res = await this.$API.maintenanceApi.getDetail(
          this.$route.params.id
        );
        console.log("获取维修详情:", res);
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
      };
      const res = await this.$API.maintenanceApi.update(this.$route.params.id, {
        status,
      });
      if (res.code === 200) {
        this.$message.success(`已标记为${statusLabel[status]}`);
      }
      this.fetchDetail();
    },
  },
};
</script>
