# 学校维修记录管理系统

前后端分离的 BIM 建筑维修管理系统，基于 Vue 2 + Express + BIMface SDK。

## 项目结构

```
school-maintenance-system/
├── frontend/          # 前端项目（Vue 2 + Element UI + BIMface）
└── backend/           # 后端项目（Express + JWT + JSON 文件存储）
```

## 快速启动

### 后端

```bash
cd backend
npm install
npm run init-db    # 首次运行，初始化数据库和默认账号
npm start          # 启动后端服务 http://localhost:3001
```

### 前端

```bash
cd frontend
npm install
npm run serve      # 启动前端开发服务器 http://localhost:5173
```

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| teacher1 | 123456 | 教师 |
| teacher2 | 123456 | 教师 |
| student1 | 123456 | 学生 |
| fixer1 | 123456 | 维修人员 |

## 技术栈

- **前端**: Vue 2.7 + Element UI 2.15 + Vuex 3 + Vue Router 3 + ECharts + BIMface SDK
- **后端**: Express 4 + JWT + bcryptjs + JSON 文件存储
- **构建**: Vue CLI 5 + Webpack

## 功能

- 用户登录/注册/权限管理
- BIM 3D 模型查看（多模型叠加）
- 楼层选择与分离显示
- 构件点击定位、高亮、缩放
- 维修记录 CRUD（新建/编辑/删除/详情）
- 从维修详情页跳转 BIM 自动定位构件
- 数据看板（ECharts 统计图表）
