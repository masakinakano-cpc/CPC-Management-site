#!/bin/bash

echo "🛑 CPC管理サイトを停止しています..."

# プロジェクトディレクトリに移動
cd "/Users/apple/Desktop/CPC用の管理サイト"

# PIDファイルからプロセスを停止
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔧 バックエンドサーバーを停止中..."
        kill $BACKEND_PID
    fi
    rm -f backend.pid
fi

if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🎨 フロントエンドを停止中..."
        kill $FRONTEND_PID
    fi
    rm -f frontend.pid
fi

# 念のため、プロセス名で停止
echo "📋 残りのプロセスを停止中..."
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "node server.js" 2>/dev/null || true

# ログファイルを削除
rm -f backend.log frontend.log

echo "✅ 停止完了！"
