@echo off
REM PDD Tool Windows 安装脚本
REM 管理员权限运行此文件

echo ========================================
echo PDD运营工具 Windows 部署
echo ========================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 请使用管理员权限运行此脚本！
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装 Node.js 16+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
node --version

where psql >nul 2>&1
if %errorLevel% neq 0 (
    echo 警告: 未检测到PostgreSQL，请先安装数据库
    echo 下载地址: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo ✓ PostgreSQL 已安装

cd backend
echo.
echo 正在安装后端依赖...
call npm install

echo.
echo 正在复制环境配置文件...
if not exist .env (
    copy .env.example .env
    echo.
    echo ⚠ 请编辑 backend\.env 文件，配置数据库连接信息
    echo.
    pause
)

cd ..\desktop
echo.
echo 正在安装前端依赖...
call npm install

echo.
echo ========================================
echo 安装完成！
echo.
echo 下一步：
echo 1. 编辑 backend\.env 文件，配置数据库
echo 2. 运行 start-dev.bat 启动开发环境
echo ========================================
pause
