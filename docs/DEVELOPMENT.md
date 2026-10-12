# 开发指南

## 项目结构

```
pdd-tool/
├── backend/              # Node.js后端服务
│   ├── src/
│   │   ├── index.ts     # 主入口
│   │   ├── database/    # 数据库连接和schema
│   │   ├── services/    # 业务逻辑层
│   │   │   ├── bitbrowser.ts    # 比特浏览器API封装
│   │   │   ├── pinduoduo.ts     # 拼多多自动化
│   │   │   ├── taskExecutor.ts  # 任务执行器
│   │   │   └── taskQueue.ts     # 任务队列
│   │   ├── routes/      # API路由
│   │   │   ├── auth.ts
│   │   │   ├── shops.ts
│   │   │   ├── products.ts
│   │   │   ├── statistics.ts
│   │   │   ├── groups.ts
│   │   │   ├── tasks.ts
│   │   │   └── integration.ts
│   │   └── utils/
│   └── package.json
├── desktop/             # Tauri桌面应用
│   ├── src/
│   │   ├── components/  # React组件
│   │   │   ├── ShopList.tsx      # 店铺管理
│   │   │   ├── LoginDialog.tsx   # 登录对话框
│   │   │   ├── ProductList.tsx   # 商品管理
│   │   │   └── Statistics.tsx    # 数据统计
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── docs/

## 环境设置

### 后端环境要求

- Node.js 16+
- PostgreSQL 13+
- BitBrowser（本地运行）

### 安装步骤

1. **安装后端依赖**

```bash
cd backend
npm install
```

2. **配置环境变量**

```bash
cp .env.example .env
```

编辑 `.env`：

```
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pdd_tool
DB_USER=postgres
DB_PASSWORD=your_password

# BitBrowser
BITBROWSER_API_URL=http://127.0.0.1:54345

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

3. **初始化数据库**

```bash
createdb pdd_tool
npm run dev
```

服务会自动初始化数据库schema。

### 前端环境要求

- Node.js 16+
- Rust 1.70+（构建Tauri应用）

### 安装步骤

```bash
cd desktop
npm install
npm run dev
```

## 运行开发环境

### 启动后端

```bash
cd backend
npm run dev
```

服务运行在 `http://localhost:3001`

### 启动前端

```bash
cd desktop
npm run dev
```

应用会自动打开，支持热重载。

## API端点

### 认证

- `POST /api/auth/register` - 注册用户
- `POST /api/auth/login` - 用户登录

### 店铺管理

- `GET /api/shops` - 获取所有店铺
- `GET /api/shops/:shopId` - 获取店铺详情
- `POST /api/shops` - 创建店铺
- `PUT /api/shops/:shopId` - 更新店铺
- `DELETE /api/shops/:shopId` - 删除店铺

### 分组

- `GET /api/groups` - 获取所有分组
- `POST /api/groups` - 创建分组
- `PUT /api/groups/:groupId` - 更新分组
- `DELETE /api/groups/:groupId` - 删除分组
- `GET /api/groups/:groupId/shops` - 获取分组内的店铺

### 商品

- `GET /api/products/shop/:shopId` - 获取店铺商品
- `GET /api/products/:productId` - 获取商品详情
- `POST /api/products` - 添加商品
- `DELETE /api/products/:productId` - 删除商品

### 统计数据

- `GET /api/statistics/shop/:shopId` - 获取店铺统计数据
- `GET /api/statistics/:statsId` - 获取统计记录
- `POST /api/statistics` - 添加统计数据
- `POST /api/statistics/compare` - 多店铺对比

### 任务

- `GET /api/tasks` - 获取任务列表
- `GET /api/tasks/:taskId` - 获取任务详情
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/:taskId` - 更新任务

### 集成接口

- `POST /api/integration/bitbrowser/health` - 检查比特浏览器
- `GET /api/integration/bitbrowser/groups` - 获取比特浏览器分组
- `POST /api/integration/tasks/shop-login/:shopId` - 启动店铺登录
- `POST /api/integration/tasks/product-sync/:shopId` - 启动商品同步
- `POST /api/integration/tasks/stats-sync/:shopId` - 启动统计数据同步

## 数据库

### 主要表

#### shops
- 店铺信息表
- 字段：id, user_id, shop_name, platform_shop_id, account_name, phone, owner_name, status, remark等

#### shop_groups
- 店铺分组表
- 字段：id, user_id, group_name

#### products
- 商品表
- 字段：id, shop_id, product_id, product_name, price, sales_count, status

#### statistics
- 统计数据表
- 字段：id, shop_id, date, daily_sales, daily_orders, conversion_rate, page_views

#### tasks
- 任务表
- 字段：id, user_id, shop_id, task_type, status, result, error_message

## 比特浏览器集成

### 配置

1. 安装比特浏览器
2. 在比特浏览器中打开系统设置
3. 获取本地接口 URL（通常是 `http://127.0.0.1:54345`）
4. 在 `.env` 中配置 `BITBROWSER_API_URL`

### 工作流程

1. **店铺登录**：
   - 用户在前端点击"登录"
   - 后端创建比特浏览器窗口
   - 打开拼多多登录页面
   - 用户在浏览器中完成登录
   - 后端自动提取店铺信息
   - 存储到数据库

2. **数据同步**：
   - 后端打开比特浏览器
   - 导航到拼多多页面
   - 使用Puppeteer提取页面数据
   - 保存到数据库
   - 关闭浏览器

## 任务队列

任务队列在服务启动时初始化，自动处理待执行任务。

### 任务类型

- `shop_login` - 店铺登录
- `product_sync` - 商品数据同步
- `stats_sync` - 统计数据同步

### 重试机制

- 最多重试3次
- 失败后自动进入待重试队列
- 每1秒检查一次队列

## 构建

### 后端

```bash
cd backend
npm run build
npm start
```

### 前端（Tauri应用）

```bash
cd desktop
npm run build
```

输出文件在 `src-tauri/target/release/` 目录

## 常见问题

### 比特浏览器无法连接

1. 检查比特浏览器是否正在运行
2. 确认 `BITBROWSER_API_URL` 配置正确
3. 测试端点：`POST /api/integration/bitbrowser/health`

### 数据库连接失败

1. 确认PostgreSQL服务运行中
2. 检查环境变量中的数据库配置
3. 确保数据库已创建

### 商品数据同步不成功

1. 检查比特浏览器连接状态
2. 查看后端日志获取具体错误信息
3. 确认拼多多账号已登录

## 日志

### 后端日志

- 实时日志显示在终端
- 错误日志保存到 `error.log`
- 完整日志保存到 `combined.log`

### 查看日志

```bash
tail -f error.log
tail -f combined.log
```

## 性能优化

1. 数据库索引已优化，查询响应快速
2. 任务队列避免并发问题
3. 前端分页加载大数据集
4. Tauri应用包体积小，启动快

## 测试

### 测试认证

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'
```

### 测试比特浏览器连接

```bash
curl -X POST http://localhost:3001/api/integration/bitbrowser/health
```

### 测试店铺创建

```bash
curl -X POST http://localhost:3001/api/shops \
  -H "Content-Type: application/json" \
  -H "x-user-id: your-user-id" \
  -d '{"shop_name":"Test Shop","account_name":"account"}'
```

## 下一步

- [ ] 添加单元测试
- [ ] 添加E2E测试
- [ ] 实现WebSocket实时通知
- [ ] 添加更详细的日志
- [ ] 性能监控
- [ ] 用户权限管理
- [ ] 数据导出功能
- [ ] 定时任务调度
