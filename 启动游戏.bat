@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动昆特牌中文版，浏览器将自动打开...
echo 关闭此窗口即停止游戏服务器。
start "" http://127.0.0.1:8788
node server.mjs
pause
