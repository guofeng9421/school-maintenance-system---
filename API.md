# 学校维修管理系统 - 后端接口文档

> 基础路径：`/api`
> 后端端口：`3001`
> 认证方式：请求头 `Authorization: Bearer <token>`

---

## 一、认证模块 (auth)

### 1. 用户登录
- **路径**：`POST /api/auth/login`
- **需要认证**：否
- **参数**：`{ username: string, password: string }`
- **返回**：
```json
{
  "code": 200,
  "data": {
    "token": "jwt_token_string",
    "user": {
      "id": 1,
      "username": "admin",
      "real_name": "系统管理员",
      "role": "admin",
      "phone": ""
    }
  }
}
```

### 2. 用户注册
- **路径**：`POST /api/auth/register`
- **需要认证**：否
- **参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| real_name | string | 否 | 真实姓名 |
| role | string | 否 | 角色，默认 teacher |
| phone | string | 否 | 手机号 |

- **返回**：`{ code: 200, message: "注册成功", data: { id: number } }`

### 3. 获取当前用户信息
- **路径**：`GET /api/auth/userinfo`
- **需要认证**：是
- **返回**：`{ code: 200, data: { id, username, real_name, role, phone } }`

### 4. 获取所有用户列表
- **路径**：`GET /api/auth/users`
- **需要认证**：是
- **返回**：`{ code: 200, data: [{ id, username, real_name, role, phone, created_at }, ...] }`

### 5. 新增用户
- **路径**：`POST /api/auth`
- **需要认证**：是
- **参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |
| real_name | string | 否 | 真实姓名 |
| role | string | 否 | 角色，默认 teacher |
| phone | string | 否 | 手机号 |

- **返回**：`{ code: 200, message: "新增成功", data: { id: number } }`

### 6. 更新用户信息
- **路径**：`PUT /api/auth/:id`
- **需要认证**：是
- **参数**：`:id` 用户ID + 需要更新的字段
- **可更新字段**：username, password（自动加密）, real_name, role, phone
- **返回**：`{ code: 200, message: "更新成功" }`

### 7. 删除用户
- **路径**：`DELETE /api/auth/:id`
- **需要认证**：是
- **参数**：`:id` 用户ID
- **返回**：`{ code: 200, message: "删除成功" }`

---

## 二、维修记录模块 (maintenance)

### 1. 获取列表（分页+筛选）
- **路径**：`GET /api/maintenance/list`
- **需要认证**：是
- **查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页条数，默认10 |
| status | string | 否 | 状态筛选：pending/processing/completed/rejected |
| category | string | 否 | 分类筛选：electrical/plumbing/furniture/door_window/floor/wall/other |
| priority | string | 否 | 优先级筛选：low/medium/high/urgent |
| keyword | string | 否 | 关键词搜索（标题/位置/描述） |

- **返回**：
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": 1,
        "title": "教室灯管损坏",
        "description": "走廊灯管闪烁",
        "location": "教学楼A 3层 301",
        "building": "教学楼A",
        "floor": "3层",
        "room": "301",
        "category": "electrical",
        "priority": "medium",
        "status": "pending",
        "reporter_id": 1,
        "reporter_name": "张三",
        "handler_id": null,
        "handler_name": null,
        "model_element_id": "462956",
        "model_element_name": "构件#462956",
        "model_name": "教学楼A栋",
        "images": ["/uploads/xxx.png"],
        "created_at": "2026-06-30T07:54:07.785Z",
        "updated_at": "2026-06-30T07:54:26.128Z",
        "completed_at": null
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10
  }
}
```

### 2. 获取详情
- **路径**：`GET /api/maintenance/detail/:id`
- **需要认证**：是
- **参数**：`:id` 维修记录ID
- **返回**：`{ code: 200, data: { 同列表单项字段 } }`

### 3. 新建报修
- **路径**：`POST /api/maintenance/create`
- **需要认证**：是
- **参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 报修标题 |
| location | string | 否 | 报修位置 |
| building | string | 否 | 楼栋 |
| floor | string | 否 | 楼层 |
| room | string | 否 | 房间号 |
| category | string | 是 | 分类 |
| priority | string | 否 | 优先级，默认 medium |
| description | string | 是 | 问题描述 |
| images | string[] | 否 | 图片URL数组 |
| model_element_id | string | 否 | BIM构件ID |
| model_element_name | string | 否 | BIM构件名称 |
| model_name | string | 否 | 所属模型名称 |

- **返回**：`{ code: 200, message: "报修成功", data: { id: number } }`

### 4. 更新记录
- **路径**：`PUT /api/maintenance/update/:id`
- **需要认证**：是
- **参数**：`:id` 维修记录ID + 需要更新的字段
- **可更新字段**：title, location, building, floor, room, category, priority, description, status, handler_id, handler_name, images, model_element_id, model_element_name, model_name
- **返回**：`{ code: 200, message: "更新成功" }`

### 5. 删除记录
- **路径**：`DELETE /api/maintenance/delete/:id`
- **需要认证**：是
- **参数**：`:id` 维修记录ID
- **返回**：`{ code: 200, message: "删除成功" }`

### 6. 按构件查询关联记录
- **路径**：`GET /api/maintenance/by-element/:elementId`
- **需要认证**：是
- **参数**：`:elementId` BIM构件ID
- **返回**：`{ code: 200, data: [record, ...] }`

### 7. 获取统计数据
- **路径**：`GET /api/maintenance/statistics`
- **需要认证**：是
- **返回**：
```json
{
  "code": 200,
  "data": {
    "total": 100,
    "pending": 10,
    "processing": 20,
    "completed": 70,
    "byCategory": [
      { "category": "electrical", "count": 30 },
      { "category": "plumbing", "count": 20 }
    ],
    "byPriority": [
      { "priority": "high", "count": 15 },
      { "priority": "medium", "count": 50 }
    ],
    "recent": [
      { "id": 1, "title": "...", "status": "...", "priority": "...", "created_at": "..." }
    ]
  }
}
```

### 8. 上传图片
- **路径**：`POST /api/maintenance/upload`
- **需要认证**：是
- **Content-Type**：`multipart/form-data`
- **参数**：`images` 文件字段（最多9张，单张≤10MB）
- **超时**：30秒
- **返回**：`{ code: 200, data: ["/uploads/xxx.jpg", ...] }`

---

## 三、BIMface 模块 (bimface)

### 1. 获取 Access Token
- **路径**：`GET /api/bimface/token`
- **需要认证**：是
- **返回**：`{ code: 200, data: { token: string } }`

### 2. 获取模型 View Token
- **路径**：`GET /api/bimface/view-token/:fileId`
- **需要认证**：是
- **参数**：`:fileId` BIMface文件ID
- **返回**：`{ code: 200, data: { viewToken: string } }`

### 3. 获取模型列表
- **路径**：`GET /api/bimface/models`
- **需要认证**：是
- **返回**：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "教学楼A栋",
      "token": "viewToken字符串",
      "description": "",
      "position": { "x": 0, "y": 0, "z": 0 },
      "visible": true
    }
  ]
}
```

---

## 四、其他

### 健康检查
- **路径**：`GET /api/health`
- **返回**：`{ code: 200, message: "服务运行正常" }`

---

## 通用响应格式

```json
{
  "code": 200,       // 200=成功, 400=参数错误, 401=未认证, 404=不存在, 500=服务器错误
  "message": "...",  // 提示信息
  "data": ...        // 业务数据（成功时）
}
```

---

## 数据模型

### 用户 (users)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 用户ID（自增） |
| username | string | 用户名 |
| password | string | 密码（bcrypt加密） |
| real_name | string | 真实姓名 |
| role | string | 角色：admin/teacher/student/maintenance |
| phone | string | 手机号 |
| created_at | string | 创建时间（ISO 8601） |

### 维修记录 (maintenance_records)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 记录ID（自增） |
| title | string | 报修标题 |
| description | string | 问题描述 |
| location | string | 报修位置 |
| building | string | 楼栋 |
| floor | string | 楼层 |
| room | string | 房间号 |
| category | string | 分类 |
| priority | string | 优先级 |
| status | string | 状态：pending/processing/completed/rejected |
| reporter_id | number | 报修人ID |
| reporter_name | string | 报修人姓名 |
| handler_id | string | 处理人ID |
| handler_name | string | 处理人姓名 |
| model_element_id | string | BIM构件ID |
| model_element_name | string | BIM构件名称 |
| model_name | string | 所属模型名称 |
| images | string[] | 图片URL数组 |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |
| completed_at | string | 完成时间 |
