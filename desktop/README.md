# PDD工具桌面应用

Tauri + React + TypeScript 桌面应用

## 功能特性

- 轻量级（包体积 < 15MB）
- 快速响应
- 原生性能

## 环境要求

- Node.js 16+
- Rust 1.70+
- npm 或 yarn

## 安装

```bash
npm install
```

## 开发

```bash
npm run dev
```

应用会自动打开，支持热重载

## 打包

```bash
npm run build
```

输出文件在 `src-tauri/target/release/` 目录

## 项目结构

```
├── src/
│   ├── components/     # React组件
│   ├── stores/         # 状态管理（Zustand）
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/          # Tauri配置
└── package.json
```

## 模块说明

### ShopList 店铺列表组件
- 显示所有店铺
- 支持添加、编辑、删除
- 状态筛选
- 分组管理
