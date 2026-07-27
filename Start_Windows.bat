@echo off
chcp 65001 >nul
title Aether SSH Viewer - 動作中
echo ========================================================
echo   Aether SSH Viewer (Notion UI) を起動しています...
echo ========================================================
echo.

cd /d "%~dp0backend"

:: Node.jsの確認
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [エラー] Node.js が見つかりません。「Setup_Windows.bat」を先に実行してください。
    pause
    exit /b 1
)

echo [情報] サーバーAPIおよび静的UIをポート3001で起動中...
echo.

:: 2秒後にデフォルトブラウザで http://localhost:3001 を自動で開く
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3001"

echo --------------------------------------------------------
echo  準備完了！ブラウザに自動で画面が表示されます。
echo  👉 http://localhost:3001
echo --------------------------------------------------------
echo  ※このコマンド画面を開いたままアプリをご利用ください。
echo  ※終了する場合は、この画面の右上の[×]で閉じるか、Ctrl+Cを押してください。
echo --------------------------------------------------------
echo.
node server.js
