# PDD工具后端服务

Node.js + Express + PostgreSQL 后台服务

## 环境要求

- Node.js 16+
- PostgreSQL 13+
- npm 或 yarn

## 安装

```bash
npm install
```

## 配置

复制 `.env.example` 为 `.env`，然后填写配置：

```bash
cp .env.example .env
```

## 开发

```bash
npm run dev
```

服务会在 `http://localhost:3001` 运行

## 构建

```bash
npm run build
npm start
```

## 数据库初始化

首先确保 PostgreSQL 服务运行，然后：

```bash
createdb pdd_tool
npm run dev  # 自动初始化schema
```

## API文档

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录

### 店铺管理
- `GET /api/shops` - 获取所有店铺
- `GET /api/shops/:shopId` - 获取店铺详情
- `POST /api/shops` - 创建店铺
- `PUT /api/shops/:shopId` - 更新店铺
- `DELETE /api/shops/:shopId` - 删除店铺

### 任务
- `GET /api/tasks` - 获取任务列表
- `POST /api/tasks` - 创建任务
- `PUT /api/tasks/:taskId` - 更新任务

## BitBrowser集成

待实现 BitBrowser API 集成层
