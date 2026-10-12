@echo off
echo ========================================
echo PDD运营工具 - 开发环境启动
echo ========================================
echo.

if not exist backend\.env (
    echo 错误: backend\.env 文件不存在！
    echo 请先运行 install.bat
    pause
    exit /b 1
)

echo 启动后端服务...
start "PDD Backend" cmd /k "cd backend && npm run dev"

timeout /t 3

echo 启动前端应用...
start "PDD Desktop" cmd /k "cd desktop && npm run dev"

echo.
echo ========================================
echo ✓ 应用已启动！
echo ========================================
pause
