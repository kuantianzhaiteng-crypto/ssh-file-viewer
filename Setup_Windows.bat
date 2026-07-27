@echo off
chcp 65001 >nul
title Aether SSH Viewer - Windows インストーラー
echo ========================================================
echo   Aether SSH Viewer (Notion UI) - Windows 自動セットアップ
echo ========================================================
echo.

:: 1. Node.jsのインストール確認
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [エラー] Node.js がインストールされていません。
    echo 公式サイト(https://nodejs.org/) より Node.js (LTS版) をインストールしてから、
    echo 再度このインストーラーをダブルクリックしてください。
    echo.
    pause
    exit /b 1
)

echo [1/3] バックエンドAPIサーバーの準備を行っています...
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 (
    echo [エラー] バックエンドのセットアップに失敗しました。
    pause
    exit /b 1
)

echo.
echo [2/3] フロントエンドUIの構築(静的コンパイル)を行っています...
cd /d "%~dp0frontend"
if not exist "dist\index.html" (
    echo 依存ライブラリをインストール中...
    call npm install
    echo UIを最適化ビルド中...
    call npm run build
) else (
    echo [情報] 既にコンパイル済みのUIが検出されました。
)

echo.
echo [3/3] Windows デスクトップにショートカットを作成しています...
cd /d "%~dp0"
set "TARGET=%~dp0Start_Windows.bat"
set "SHORTCUT=%USERPROFILE%\Desktop\Aether SSH Viewer.lnk"
set "ICON=%SystemRoot%\System32\imageres.dll,67"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%~dp0'; $s.Description = 'Aether SSH Viewer (Notion UI)'; $s.IconLocation = '%ICON%'; $s.Save()"

echo.
echo ========================================================
echo   🎉 インストールとセットアップが完了しました！
echo.
echo   【起動方法】
echo   デスクトップに作成されたショートカット「Aether SSH Viewer」、
echo   またはフォルダ内の「Start_Windows.bat」をダブルクリックしてください。
echo ========================================================
echo.
pause
