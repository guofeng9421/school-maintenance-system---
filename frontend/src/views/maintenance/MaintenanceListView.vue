<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-input v-model="query.keyword" placeholder="搜索标题/位置" clearable style="width:220px" @clear="fetchList" @keyup.enter.native="fetchList" />
      <el-select v-model="query.status" placeholder="状态" clearable style="width:130px" @change="fetchList">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已完成" value="completed" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-select v-model="query.category" placeholder="分类" clearable style="width:130px" @change="fetchList">
        <el-option label="电气" value="electrical" />
        <el-option label="水暖" value="plumbing" />
        <el-option label="家具" value="furniture" />
        <el-option label="门窗" value="door_window" />
        <el-option label="地面" value="floor" />
        <el-option label="墙面" value="wall" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-select v-model="query.priority" placeholder="优先级" clearable style="width:130px" @change="fetchList">
        <el-option label="低" value="low" />
        <el-option label="中" value="medium" />
        <el-option label="高" value="high" />
        <el-option label="紧急" value="urgent" />
      </el-select>
      <el-button type="primary" @click="fetchList">
        <i class="el-icon-search"></i> 搜索
      </el-button>
      <el-button type="success" @click="$router.push('/maintenance/create')">
        <i class="el-icon-plus"></i> 新建报修
      </el-button>
    </div>

    <el-table :data="list" stripe v-loading="loading" style="width:100%">
      <el-table-column prop="id" label="编号" width="130" />
      <el-table-column prop="title" label="报修标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="location" label="位置" min-width="160" show-overflow-tooltip />
      <el-table-column prop="building" label="楼栋" width="90" />
      <el-table-column prop="category" label="分类" width="90">
        <template slot-scope="{ row }">{{ categoryMap[row.category] }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template slot-scope="{ row }">
          <el-tag :type="statusType[row.status]">{{ statusMap[row.status]}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="90">
        <template slot-scope="{ row }">
          <el-tag :type="priorityType[row.priority]">{{ priorityMap[row.priority] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reporter_name" label="报修人" width="90" />
      <el-table-column prop="created_at" label="报修时间" width="170">
        <template slot-scope="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="模型关联" width="90">
        <template slot-scope="{ row }">
          <el-tag v-if="row.model_element_id" type="success" size="small">已关联</el-tag>
          <el-tag v-else type="info" size="small">未关联</el-tag>
        </template>
      </el-table-column>
      <!-- 图片列：显示最多3张缩略图，点击可预览大图，超出部分显示+N -->
      <el-table-column label="图片" width="120">
        <template slot-scope="{ row }">
          <div v-if="row.images && row.images.length" style="display:flex;gap:4px;flex-wrap:wrap;">
            <el-image v-for="(img, idx) in row.images.slice(0, 3)" :key="idx" :src="img" :preview-src-list="row.images" fit="cover" style="width:36px;height:36px;border-radius:4px;cursor:pointer;" />
            <span v-if="row.images.length > 3" style="font-size:12px;color:#909399;line-height:36px;">+{{ row.images.length - 3 }}</span>
          </div>
          <span v-else style="color:#c0c4cc;">-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template slot-scope="{ row }">
          <el-button type="text" size="small" @click="$router.push(`/maintenance/detail/${row.id}`)">详情</el-button>
          <el-button type="text" size="small" @click="$router.push(`/maintenance/edit/${row.id}`)">编辑</el-button>
          <el-popconfirm title="确认删除?" @confirm="handleDelete(row.id)">
            <el-button slot="reference" type="text" size="small" style="color:#f56c6c;">删除</el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination v-if="total > 0" style="margin-top: 16px; text-align: right;" :current-page="query.page" :page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @current-change="handlePageChange" @size-change="handleSizeChange" />
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

// 维修记录列表页面：展示所有报修记录，支持搜索、筛选、分页
export default {
  name: "MaintenanceListView",
  data() {
    return {
      list: [], // 列表数据
      total: 0, // 总记录数（用于分页）
      loading: false, // 表格loading状态
      // 查询参数：页码、每页条数、关键词、状态、分类、优先级
      query: {
        page: 1,
        pageSize: 10,
        keyword: "",
        status: "",
        category: "",
        priority: "",
      },
      categoryMap,
      priorityMap,
      statusMap,
      statusType,
      priorityType, // 常量映射
    };
  },
  mounted() {
    this.fetchList(); // 页面加载时获取列表数据
  },
  methods: {
    formatDate, // 格式化日期工具函数
    // 从后端获取维修记录列表
    async fetchList() {
      this.loading = true;
      try {
        const res = await this.$API.maintenanceApi.getList(this.query);
        if (res.code === 200) {
          this.list = res.data.list;
          this.total = res.data.total;
        }
      } finally {
        this.loading = false;
      }
    },
    // 切换页码
    handlePageChange(page) {
      this.query.page = page;
      this.fetchList();
    },
    // 切换每页条数（重置到第一页）
    handleSizeChange(size) {
      this.query.pageSize = size;
      this.query.page = 1;
      this.fetchList();
    },
    // 删除记录：调用API后刷新列表
    async handleDelete(id) {
      await this.$API.maintenanceApi.remove(id);
      this.$message.success("删除成功");
      this.fetchList();
    },
  },
};
</script>
