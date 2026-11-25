@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动《灰港三夜》本地服务器，浏览器将自动打开正式入口...
echo 关闭此窗口即停止游戏服务器。
start "" http://127.0.0.1:8788/
node server.mjs
pause
