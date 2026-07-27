#!/bin/bash
set -e

echo "========================================================"
echo "  Aether SSH Viewer (Notion UI) - Ubuntu / Linux 自動セットアップ"
echo "========================================================"
echo ""

# 1. Node.js と npm の確認
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "[エラー] Node.js または npm がインストールされていません。"
    echo "以下のコマンドを実行して Node.js (LTS版) をインストールしてから、"
    echo "再度このスクリプトを実行してください:"
    echo ""
    echo "  sudo apt update && sudo apt install -y nodejs npm"
    echo ""
    echo "または、NodeSource や nvm を使用して Node.js をインストールしてください。"
    exit 1
fi

NODE_VER=$(node -v)
echo "[情報] Node.js ${NODE_VER} を検出しました。"
echo ""

# スクリプトの配置ディレクトリを絶対パスで取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "[1/3] バックエンドAPIサーバーの準備を行っています..."
cd "$SCRIPT_DIR/backend"
npm install
if [ $? -ne 0 ]; then
    echo "[エラー] バックエンドのセットアップに失敗しました。"
    exit 1
fi

echo ""
echo "[2/3] フロントエンドUIの構築(静的コンパイル)を行っています..."
cd "$SCRIPT_DIR/frontend"
if [ ! -f "dist/index.html" ]; then
    echo "依存ライブラリをインストール中..."
    npm install
    echo "UIを最適化ビルド中..."
    npm run build
else
    echo "[情報] 既存のビルドを検出しました。最新版で再コンパイルします..."
    npm install
    npm run build
fi

echo ""
echo "[3/3] Ubuntu / Linux デスクトップにショートカットを作成しています..."
cd "$SCRIPT_DIR"

# 起動スクリプトに実行権限を付与
chmod +x "$SCRIPT_DIR/start_ubuntu.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/start.sh" 2>/dev/null || true
chmod +x "$SCRIPT_DIR/setup_ubuntu.sh" 2>/dev/null || true

# デスクトップディレクトリの決定
DESKTOP_DIR=$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")
if [ ! -d "$DESKTOP_DIR" ]; then
    if [ -d "$HOME/デスクトップ" ]; then
        DESKTOP_DIR="$HOME/デスクトップ"
    else
        mkdir -p "$HOME/Desktop"
        DESKTOP_DIR="$HOME/Desktop"
    fi
fi

# アイコンファイルの決定
ICON_PATH="$SCRIPT_DIR/aether-icon.svg"
if [ ! -f "$ICON_PATH" ]; then
    ICON_PATH="network-server"
fi

# .desktop ファイルの生成（デスクトップ用）
DESKTOP_FILE="$DESKTOP_DIR/aether-ssh-viewer.desktop"
APP_DIR="$HOME/.local/share/applications"
mkdir -p "$APP_DIR"
APP_FILE="$APP_DIR/aether-ssh-viewer.desktop"

cat << EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Type=Application
Name=Aether SSH Viewer
Comment=Notion-Style SSH/SFTP File Viewer
Exec="$SCRIPT_DIR/start_ubuntu.sh"
Icon=$ICON_PATH
Terminal=true
Categories=Network;Utility;FileTools;
Keywords=SSH;SFTP;Viewer;File;Notion;
EOF

# アプリケーションメニューにもコピー
cp "$DESKTOP_FILE" "$APP_FILE"

# デスクトップ上のショートカットに実行権限を付与（Ubuntu / GNOME で必須）
chmod +x "$DESKTOP_FILE"
chmod +x "$APP_FILE"

# GNOME Desktop の場合は可能なら trusted に設定
if command -v gio >/dev/null 2>&1; then
    gio set "$DESKTOP_FILE" metadata::trusted true 2>/dev/null || true
fi

echo ""
echo "========================================================"
echo "  🎉 Ubuntu / Linux 用のセットアップが完了しました！"
echo ""
echo "  【起動方法】"
echo "  1. デスクトップのショートカット「Aether SSH Viewer」をダブルクリック"
echo "     (※ Ubuntuのバージョンによっては、アイコンを右クリックして"
echo "        「起動を許可 (Allow Launching)」を選択してください)"
echo "  2. またはターミナルから以下を実行："
echo "     $SCRIPT_DIR/start_ubuntu.sh"
echo "========================================================"
echo ""
