@echo off
chcp 65001 >nul
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║            PDD运营工具 - 一键安装                        ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ 错误：请以管理员身份运行此程序
    echo.
    echo 操作方法：
    echo 1. 按住 Shift 键
    echo 2. 右键点击此文件
    echo 3. 选择 "以管理员身份运行"
    echo.
    pause
    exit /b 1
)

echo ✓ 管理员权限已获得
echo.

REM 检查Node.js
echo 检查 Node.js...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ 未检测到 Node.js
    echo.
    echo 请下载并安装 Node.js 16+
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% 已安装

REM 检查PostgreSQL
echo 检查 PostgreSQL...
where psql >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ 未检测到 PostgreSQL
    echo.
    echo 请下载并安装 PostgreSQL 13+
    echo 下载地址: https://www.postgresql.org/download/windows/
    echo.
    pause
    exit /b 1
)
echo ✓ PostgreSQL 已安装

echo.
echo ════════════════════════════════════════════════════════════
echo 开始安装 PDD运营工具...
echo ════════════════════════════════════════════════════════════
echo.

REM 安装后端
echo 【1/4】 安装后端依赖...
cd backend
if exist node_modules (
    echo ✓ 后端依赖已存在，跳过
) else (
    call npm install --legacy-peer-deps
    if %errorLevel% neq 0 (
        echo ❌ 后端安装失败
        pause
        exit /b 1
    )
)

REM 创建.env文件
if not exist .env (
    echo ✓ 创建配置文件
    (
        echo NODE_ENV=development
        echo PORT=3001
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=pdd_tool
        echo DB_USER=postgres
        echo DB_PASSWORD=postgres
        echo BITBROWSER_API_URL=http://127.0.0.1:54345
        echo JWT_SECRET=pdd_tool_secret_key_change_this
        echo JWT_EXPIRES_IN=7d
        echo CORS_ORIGIN=*
        echo LOG_LEVEL=info
    ) > .env
    echo ✓ 配置文件已创建
)

cd ..

REM 安装前端
echo 【2/4】 安装前端依赖...
cd desktop
if exist node_modules (
    echo ✓ 前端依赖已存在，跳过
) else (
    call npm install --legacy-peer-deps
    if %errorLevel% neq 0 (
        echo ❌ 前端安装失败
        pause
        exit /b 1
    )
)
cd ..

REM 创建数据库
echo 【3/4】 创建数据库...
psql -U postgres -c "CREATE DATABASE pdd_tool ENCODING 'UTF8';" 2>nul
if %errorLevel% equ 0 (
    echo ✓ 数据库已创建
) else (
    echo ⚠ 数据库可能已存在或创建失败
)

echo.
echo ════════════════════════════════════════════════════════════
echo 【4/4】 安装完成！
echo ════════════════════════════════════════════════════════════
echo.

echo 📌 下一步：
echo.
echo   方法1：一键启动（推荐）
echo   双击：start-dev.bat
echo.
echo   方法2：手动启动
echo   1. 打开命令行
echo   2. 进入此目录
echo   3. 运行：backend\npm run dev
echo   4. 新命令行运行：desktop\npm run dev
echo.
echo ✓ 安装完成！按任意键退出
echo.
pause
exit /b 0
