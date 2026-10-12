# 快速开始指南

## 5分钟快速启动

### 前置条件

- Node.js 16+
- PostgreSQL 13+
- 比特浏览器（已安装并运行）

### 1. 克隆项目

```bash
git clone https://github.com/15353648195-eng/-.git
cd pdd-tool
```

### 2. 后端配置和启动

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 编辑 .env 文件
# 确保数据库配置正确

# 启动后端服务
npm run dev
```

等待看到 `Server running on port 3001`

### 3. 前端启动

打开新终端窗口：

```bash
cd desktop

# 安装依赖
npm install

# 启动开发环境
npm run dev
```

应用会自动打开在 `http://localhost:3000`

### 4. 验证安装

1. 打开应用
2. 左侧菜单点击"店铺管理"
3. 点击"添加店铺"按钮

如果一切正常，你应该看到一个对话框。

## 常见命令

### 后端

```bash
npm run dev      # 开发模式，支持热重载
npm run build    # 构建
npm start        # 生产模式运行
```

### 前端

```bash
npm run dev      # 开发模式，Tauri应用
npm run build    # 构建可执行文件
```

## 文件夹说明

```
pdd-tool/
├── backend/          # 后端服务 (Node.js + Express + PostgreSQL)
├── desktop/          # 桌面应用 (Tauri + React)
├── docs/             # 文档
│   ├── ARCHITECTURE.md    # 系统架构
│   ├── API.md            # API文档
│   └── DEVELOPMENT.md    # 开发指南
└── README.md
```

## 第一次使用

### 注册账号

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "password123"
  }'
```

获取返回的 token，后续API调用时使用。

### 测试API

获取你的 user ID（从登录响应中得到），然后：

```bash
# 获取店铺列表
curl http://localhost:3001/api/shops \
  -H "x-user-id: your_user_id"

# 检查比特浏览器连接
curl -X POST http://localhost:3001/api/integration/bitbrowser/health
```

## 功能说明

### 店铺管理
- 添加和管理多个拼多多店铺
- 自动登录和信息提取
- 店铺分组管理
- 支持批量操作

### 商品管理
- 自动同步商品列表
- 查看商品信息（名称、价格、销量）
- 支持搜索和筛选
- 导出商品数据

### 数据统计
- 实时销售数据
- 订单统计
- 转化率分析
- 多店铺对比
- 时间段查询

### 自动化功能
- 定时数据同步
- 自动任务队列
- 失败重试机制

## 故障排除

### 后端无法启动

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决**：确认PostgreSQL正在运行

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
net start PostgreSQL
```

### 前端无法连接后端

**解决**：检查后端是否在运行，访问 `http://localhost:3001/api/health`

### 比特浏览器无法连接

```
Error: BitBrowser service is not available
```

**解决**：
1. 确认比特浏览器已启动
2. 检查 `.env` 中的 `BITBROWSER_API_URL` 是否正确
3. 运行后端健康检查：`POST http://localhost:3001/api/integration/bitbrowser/health`

## 下一步

- 查看 [API文档](docs/API.md) 了解所有接口
- 查看 [架构说明](docs/ARCHITECTURE.md) 了解系统设计
- 查看 [开发指南](docs/DEVELOPMENT.md) 了解开发细节

## 获取帮助

- 查看项目README
- 检查后端日志 (error.log, combined.log)
- 查看浏览器控制台输出

## 生产部署

详见 [开发指南](docs/DEVELOPMENT.md) 的构建部分。

---

**祝你使用愉快！** 🚀
