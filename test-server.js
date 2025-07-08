const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('./models');

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());

// 認証ミドルウェア
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'アクセストークンが必要です' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: '無効なトークンです' });
        }
        req.user = user;
        next();
    });
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: '認証が必要です' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: '権限が不足しています' });
        }
        next();
    };
};

// ログインエンドポイント
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // テスト用の固定ユーザー
        if (username === 'testadmin' && password === 'password123') {
            const token = jwt.sign(
                {
                    id: 1,
                    username: 'testadmin',
                    role: 'admin',
                    email: 'testadmin@example.com'
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '1h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: 1,
                    username: 'testadmin',
                    role: 'admin',
                    email: 'testadmin@example.com'
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'ユーザー名またはパスワードが正しくありません'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'ログインに失敗しました'
        });
    }
});

// 通知設定エンドポイント
app.get('/api/notifications/settings', authenticateToken, requireRole(['admin']), (req, res) => {
    res.json({
        success: true,
        data: {
            mailService: 'gmail',
            mailUser: '設定済み',
            mailPass: '設定済み',
            isConfigured: false
        }
    });
});

// 通知先ユーザーエンドポイント
app.get('/api/notifications/recipients', authenticateToken, requireRole(['admin']), (req, res) => {
    res.json({
        success: true,
        data: [
            {
                id: 1,
                username: 'testadmin',
                email: 'testadmin@example.com',
                firstName: 'Test',
                lastName: 'Admin',
                role: 'admin'
            }
        ]
    });
});

// 通知対象イベントエンドポイント
app.get('/api/notifications/target-events', authenticateToken, requireRole(['admin']), (req, res) => {
    const { type } = req.query;

    if (!['flyer-distribution', 'overdue', 'three-month-reminder'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: '無効な通知タイプです'
        });
    }

    res.json({
        success: true,
        data: {
            type,
            count: 0,
            events: []
        }
    });
});

// 通知実行エンドポイント
app.post('/api/notifications/flyer-distribution', authenticateToken, requireRole(['admin']), (req, res) => {
    res.json({
        success: true,
        message: 'チラシ配布通知を実行しました'
    });
});

app.post('/api/notifications/overdue', authenticateToken, requireRole(['admin']), (req, res) => {
    res.json({
        success: true,
        message: '期日過ぎ通知を実行しました'
    });
});

app.post('/api/notifications/three-month-reminder', authenticateToken, requireRole(['admin']), (req, res) => {
    res.json({
        success: true,
        message: '3ヶ月前リマインダーを実行しました'
    });
});

// カスタム通知エンドポイント
app.post('/api/notifications/custom', authenticateToken, requireRole(['admin']), (req, res) => {
    const { subject, message } = req.body;

    if (!subject || !message) {
        return res.status(400).json({
            success: false,
            message: '件名とメッセージは必須です'
        });
    }

    res.json({
        success: true,
        message: 'カスタム通知を送信しました'
    });
});

// テストメールエンドポイント
app.post('/api/notifications/test', authenticateToken, requireRole(['admin']), (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'テスト用メールアドレスが必要です'
        });
    }

    res.json({
        success: true,
        message: 'テストメールを送信しました'
    });
});

// 通知履歴エンドポイント
app.get('/api/notifications/history', authenticateToken, requireRole(['admin']), (req, res) => {
    res.json({
        success: true,
        data: {
            lastFlyerNotification: null,
            lastOverdueNotification: null,
            lastThreeMonthReminder: null,
            totalNotificationsSent: 0
        }
    });
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;
