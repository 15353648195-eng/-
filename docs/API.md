# API 文档

## 认证相关

### 注册
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}

Response: 201
{
  "user": { "id": "...", "username": "...", "email": "..." },
  "token": "jwt_token"
}
```

### 登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}

Response: 200
{
  "user": { "id": "...", "username": "...", "email": "..." },
  "token": "jwt_token"
}
```

## 店铺管理

### 获取所有店铺
```
GET /api/shops
Headers: x-user-id: user_id

Response: 200
{
  "data": [
    {
      "id": "...",
      "shop_name": "我的店铺",
      "platform_shop_id": "12345",
      "status": "online",
      ...
    }
  ]
}
```

### 获取店铺详情
```
GET /api/shops/:shopId

Response: 200
{
  "data": { ... }
}
```

### 创建店铺
```
POST /api/shops
Headers: x-user-id: user_id
Content-Type: application/json

{
  "shopName": "新店铺",
  "platformShopId": "12345",
  "accountName": "account",
  "phone": "13800138000",
  "ownerName": "张三",
  "openDate": "2024-01-01",
  "subjectInfo": "个体工商户"
}

Response: 201
{
  "data": { ... }
}
```

### 更新店铺
```
PUT /api/shops/:shopId
Content-Type: application/json

{
  "shopName": "新名称",
  "remark": "备注",
  "status": "online"
}

Response: 200
{
  "data": { ... }
}
```

### 删除店铺
```
DELETE /api/shops/:shopId

Response: 200
{
  "message": "Shop deleted successfully"
}
```

## 任务管理

### 获取任务列表
```
GET /api/tasks?status=pending&shopId=xxx
Headers: x-user-id: user_id

Response: 200
{
  "data": [ ... ]
}
```

### 创建任务
```
POST /api/tasks
Headers: x-user-id: user_id
Content-Type: application/json

{
  "shopId": "shop_id",
  "taskType": "shop_sync"  // shop_sync, product_sync, stats_sync
}

Response: 201
{
  "data": { ... }
}
```

### 更新任务
```
PUT /api/tasks/:taskId
Content-Type: application/json

{
  "status": "completed",
  "result": "{ ... }",
  "errorMessage": null
}

Response: 200
{
  "data": { ... }
}
```

## 错误响应

```
{
  "error": "Error message"
}
```

常见状态码：
- 200: 成功
- 201: 创建成功
- 400: 请求错误
- 401: 未授权
- 404: 不存在
- 409: 冲突（如用户已存在）
- 500: 服务器错误
