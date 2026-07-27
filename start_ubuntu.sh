#!/bin/bash
echo "========================================================"
echo "  Aether SSH Viewer (Notion UI) を起動しています..."
echo "========================================================"
echo ""

# スクリプトの配置ディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$SCRIPT_DIR/backend"

# Node.jsの確認
if ! command -v node >/dev/null 2>&1; then
    echo "[エラー] Node.js が見つかりません。「setup_ubuntu.sh」を先に実行してください。"
    echo "インストールコマンド: sudo apt update && sudo apt install -y nodejs npm"
    read -p "Enterキーを押して終了します..." -r
    exit 1
fi

echo "[情報] サーバーAPIおよび静的UIをポート3001で起動中..."
echo ""

# 2秒後にデフォルトブラウザで http://localhost:3001 を自動で開く
(
  sleep 2
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3001" >/dev/null 2>&1
  elif command -v sensible-browser >/dev/null 2>&1; then
    sensible-browser "http://localhost:3001" >/dev/null 2>&1
  elif command -v gnome-open >/dev/null 2>&1; then
    gnome-open "http://localhost:3001" >/dev/null 2>&1
  fi
) &

echo "--------------------------------------------------------"
echo " 準備完了！ブラウザに自動で画面が表示されます。"
echo " 👉 http://localhost:3001"
echo "--------------------------------------------------------"
echo " ※このターミナルを開いたままアプリをご利用ください。"
echo " ※終了する場合は、ターミナルを閉じるか Ctrl + C を押してください。"
echo "--------------------------------------------------------"
echo ""

exec node server.js
