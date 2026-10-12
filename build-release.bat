@echo off
echo ========================================
echo PDD运营工具 - 生产版本构建
echo ========================================
echo.

cd backend
echo 正在构建后端...
call npm run build

if %errorLevel% neq 0 (
    echo 错误: 后端构建失败！
    pause
    exit /b 1
)

cd ..\desktop
echo.
echo 正在构建前端应用...
call npm run build

if %errorLevel% neq 0 (
    echo 错误: 前端构建失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo 构建成功！
echo ========================================
pause
