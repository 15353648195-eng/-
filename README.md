# PDD运营工具

电商拼多多运营辅助工具，帮助店铺管理员高效运营拼多多店铺。

## 项目结构

```
├── desktop/          # Tauri桌面应用（React前端）
├── backend/          # Node.js后台服务
├── docs/             # 文档
├── config/           # 配置文件
└── README.md
```

## 技术栈

- **前端**: Tauri + React + TypeScript
- **后端**: Node.js + Express
- **数据库**: PostgreSQL
- **浏览器自动化**: BitBrowser API

## 功能模块

1. **店铺管理** - 店铺登录、状态管理、信息维护
2. **商品管理** - 商品列表、数据同步
3. **数据统计** - 销售数据、关键指标展示
4. **任务系统** - 自动化任务队列管理

## 开发环境要求

- Node.js 16+
- PostgreSQL 13+
- Rust 1.70+ (for Tauri)
- npm 或 yarn

## 快速开始

详见各模块的README文件。

## 贡献指南

遵循代码规范和提交信息规范。
