#!/bin/bash
echo "==================================================="
echo "  Starting Aether SSH Viewer (Public Network 0.0.0.0)"
echo "==================================================="

# 現在のマシンのIPアドレス（LAN / 公開アドレス）を取得
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="<あなたのIPアドレス>"
fi

# バックエンドサーバー起動 (0.0.0.0:3001)
echo "[1/2] 🚀 サーバーAPIを起動しています (0.0.0.0:3001)..."
cd "$(dirname "$0")/backend"
node server.js &
BACKEND_PID=$!

# フロントエンド開発サーバー起動 (0.0.0.0:5173)
echo "[2/2] 🌐 フロントエンドUIを起動しています (0.0.0.0:5173)..."
cd "../frontend"
npm run dev &
FRONTEND_PID=$!

echo "---------------------------------------------------"
echo " 準備完了！以下のどちらのアドレスからもアクセス可能です："
echo ""
echo " 🏠 ローカル(このPC)から:  👉 http://localhost:5173"
echo " 🌍 外部(同じLAN等)から :  👉 http://${LOCAL_IP}:5173"
echo "---------------------------------------------------"
echo "停止するには Ctrl + C を押してください。"

# 終了サインをキャッチして両方のプロセスをクリーンに終了
trap "echo '停止中...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM EXIT
wait
