# PDD运营工具 - Windows 完整部署指南

## ⚡ 5分钟快速开始

### 前置条件
- [x] Windows 10/11 64位
- [x] Node.js 16+ ([下载](https://nodejs.org/))
- [x] PostgreSQL 13+ ([下载](https://www.postgresql.org/download/windows/))
- [x] 比特浏览器已安装
- [x] 项目已克隆

### 三步启动

**步骤1：安装依赖**
```bash
右键 install.bat -> 以管理员身份运行
```

**步骤2：配置数据库**
编辑 `backend\.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pdd_tool
DB_USER=postgres
DB_PASSWORD=你的密码
```

**步骤3：启动应用**
```bash
双击 start-dev.bat
```

自动启动：
- 后端服务：http://localhost:3001
- 前端应用：Tauri窗口

---

## 🔧 详细配置

### 1. PostgreSQL 设置

```sql
-- 以管理员运行命令行
psql -U postgres

-- 创建数据库
CREATE DATABASE pdd_tool ENCODING 'UTF8';
```

### 2. 比特浏览器配置

1. 打开比特浏览器
2. 系统设置 → 获取API地址（通常 http://127.0.0.1:54345）
3. 填入 `backend\.env` 的 `BITBROWSER_API_URL`

### 3. 环境变量完整配置

编辑 `backend\.env`:
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pdd_tool
DB_USER=postgres
DB_PASSWORD=your_password
BITBROWSER_API_URL=http://127.0.0.1:54345
JWT_SECRET=change_this_to_something_secure
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
LOG_LEVEL=debug
```

---

## ✅ 验证安装

### 检查后端

访问: http://localhost:3001/api/health

应返回:
```json
{
  "status": "ok",
  "services": {
    "websocket": "connected",
    "taskQueue": "running",
    "scheduler": "running"
  }
}
```

### 检查前端

- Tauri窗口打开
- 左上角显示 "✓ 已连接"

---

## 🚀 生产版本构建

### 生成Windows .exe

```bash
双击 build-release.bat
```

输出文件:
- 后端: `backend\dist\`
- 前端: `desktop\src-tauri\target\release\pdd-tool.exe`

### 启动生产版本

```bash
cd backend
npm start

# 新终端，运行.exe
desktop\src-tauri\target\release\pdd-tool.exe
```

---

## 🐛 常见问题

### Node.js 命令未找到
- 重新安装 Node.js
- **重启电脑** (重要!)
- 重新打开命令行

### PostgreSQL 连接失败
```bash
# 启动服务（管理员）
net start postgresql-x64-13

# 验证连接
psql -U postgres
```

### 比特浏览器无连接
- 确保比特浏览器已启动
- 验证 BITBROWSER_API_URL 配置正确
- 测试: http://localhost:3001/api/integration/bitbrowser/health

### 端口3001被占用
```bash
# 查找占用进程
netstat -ano | findstr :3001

# 杀死进程（假设PID为1234）
taskkill /PID 1234 /F
```

---

## 📊 虚拟机测试清单

- [ ] 在虚拟机Windows中运行 install.bat
- [ ] 编辑配置文件
- [ ] 运行 start-dev.bat
- [ ] 验证后端 /api/health
- [ ] 测试前端应用打开
- [ ] 测试WebSocket连接
- [ ] 测试店铺登录功能
- [ ] 测试数据同步

---

## 📦 文件说明

| 文件 | 说明 |
|------|------|
| install.bat | 自动安装依赖和配置 |
| start-dev.bat | 一键启动开发环境 |
| build-release.bat | 生产版本构建 |
| backend/.env | 后端配置文件 |

---

## 📞 需要帮助?

检查日志:
- 后端: `backend/error.log`
- 前端: 浏览器F12开发者工具

---

祝部署成功！🚀
