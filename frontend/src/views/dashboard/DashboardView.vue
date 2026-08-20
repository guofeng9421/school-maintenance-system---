<template>
  <div class="page-container">
    <el-row :gutter="20" class="stat-row">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <i class="el-icon-document" style="color:#409eff;font-size:28px;"></i>
            <div class="stat-content">
              <div class="stat-title">维修总数</div>
              <div class="stat-value">{{ stats.total }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <i class="el-icon-time" style="color:#e6a23c;font-size:28px;"></i>
            <div class="stat-content">
              <div class="stat-title">待处理</div>
              <div class="stat-value">{{ stats.pending }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <!-- <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <i class="el-icon-loading" style="color:#409eff;font-size:28px;"></i>
            <div class="stat-content">
              <div class="stat-title">处理中</div>
              <div class="stat-value">{{ stats.processing }}</div>
            </div>
          </div>
        </el-card>
      </el-col> -->
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <i class="el-icon-circle-check" style="color:#67c23a;font-size:28px;"></i>
            <div class="stat-content">
              <div class="stat-title">已完成</div>
              <div class="stat-value">{{ stats.completed }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header"><span>分类统计</span></div>
          <div ref="categoryChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header"><span>维修公司统计</span></div>
          <div ref="priorityChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { formatDate } from '../../utils'

// 数据看板页面：展示统计卡片、ECharts图表和最近维修列表
export default {
  name: 'DashboardView',
  data() {
    return {
      // 统计数据：总数/待处理/处理中/已完成 + 分类统计 + 优先级统计 + 最近记录
      stats: {
        total: 0, pending: 0, processing: 0, completed: 0,
        byCategory: [], byHandlerName: [], recent: []
      },
      categoryChart: null,   // 分类饼图实例
      priorityChart: null,   // 优先级柱状图实例
    }
  },
  mounted() {
    this.fetchData()  // 页面加载时获取统计数据
    
  },
  beforeDestroy() {
    // 销毁 ECharts 实例，释放内存
    if (this.categoryChart) { this.categoryChart.dispose(); this.categoryChart = null }
    if (this.priorityChart) { this.priorityChart.dispose(); this.priorityChart = null }
  },
  methods: {
    formatDate,       // 格式化日期工具函数

    // 初始化分类统计饼图（环形图）
    initCategoryChart(data) {
      this.categoryChart = echarts.init(this.$refs.categoryChartRef)
      this.categoryChart.setOption({
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],  // 环形图：内径40%，外径70%
          data: data.map(item => ({
            name: item.category,
            value: item.count
          })),
          label: { formatter: '{b}: {c}' }  // 标签显示名称和数量
        }]
      })
    },

    // 初始化优先级统计柱状图
    initPriorityChart(data) {
      this.priorityChart = echarts.init(this.$refs.priorityChartRef)
      this.priorityChart.setOption({
        tooltip: {},
        xAxis: {
          type: 'category',
          data: data.map(item => item.handlerName
)
        },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: data.map(item => item.count),
          // 柱状图颜色：低=灰色，中=蓝色，高=橙色，紧急=红色
          itemStyle: {
            color: (params) => ['#909399', '#409eff', '#e6a23c', '#f56c6c'][params.dataIndex]
          }
        }]
      })
    },

    // 从后端获取统计数据并初始化图表
    async fetchData() {
      try {
        const res = await this.$API.maintenanceApi.getStatistics()
        if (res.code === 200) {
          this.stats = { ...this.stats, ...res.data }
          // 有数据时才初始化对应图表
          if (this.stats.byCategory.length) this.initCategoryChart(this.stats.byCategory)
          if (this.stats.byHandlerName.length) this.initPriorityChart(this.stats.byHandlerName)
        }
      } catch (e) {
        console.error(e)
      }
    }
  }
}
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.stat-content {
  text-align: left;
}
.stat-title {
  font-size: 14px;
  color: #909399;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}
.stat-row .el-card {
  cursor: default;
}
</style>
