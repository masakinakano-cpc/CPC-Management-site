#!/bin/bash

echo "🚀 CPC管理サイトを起動しています..."

# プロセスを全て停止
echo "📋 既存のプロセスを停止中..."
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true
sleep 2

# プロジェクトディレクトリに移動
cd "/Users/apple/Desktop/CPC用の管理サイト"

echo "🔧 バックエンドサーバーを起動中..."
# バックエンドをバックグラウンドで起動
PORT=5002 npm start > backend.log 2>&1 &
BACKEND_PID=$!

# 5秒待機
sleep 5

echo "🎨 フロントエンドを起動中..."
# フロントエンドディレクトリに移動して起動
cd client
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

# プロセスIDを保存
echo $BACKEND_PID > ../backend.pid
echo $FRONTEND_PID > ../frontend.pid

echo "✅ 起動完了！"
echo "📱 フロントエンド: http://localhost:3000"
echo "🖥️  バックエンド: http://localhost:5002"
echo ""
echo "🔑 ログイン情報:"
echo "   ユーザー名: admin"
echo "   パスワード: admin123"
echo ""
echo "❌ 停止するには: ./stop-app.sh を実行してください"

# 10秒後にステータス確認
sleep 10
echo ""
echo "📊 ステータス確認..."

if lsof -ti:3000 >/dev/null 2>&1; then
    echo "✅ フロントエンド (ポート3000): 起動中"
else
    echo "❌ フロントエンド (ポート3000): 停止中"
fi

if lsof -ti:5002 >/dev/null 2>&1; then
    echo "✅ バックエンド (ポート5002): 起動中"
else
    echo "❌ バックエンド (ポート5002): 停止中"
fi

echo ""
echo "🌐 ブラウザで http://localhost:3000 にアクセスしてください"
