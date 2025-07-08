const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWTトークンの検証
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access token required',
                message: '認証トークンが必要です'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // ユーザー情報を取得
        const user = await User.findByPk(decoded.userId);
        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'Invalid token',
                message: '無効なトークンです'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token',
                message: '無効なトークンです'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                message: 'トークンの有効期限が切れています'
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Authentication error',
            message: '認証エラーが発生しました'
        });
    }
};

// ロールベースアクセス制御
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: '認証が必要です'
            });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: '権限が不足しています'
            });
        }

        next();
    };
};

// 管理者のみアクセス可能
const requireAdmin = requireRole('admin');

// 管理者またはマネージャーのみアクセス可能
const requireManager = requireRole(['admin', 'manager']);

// オプショナル認証（ログインしていなくてもアクセス可能）
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findByPk(decoded.userId);
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        // エラーが発生しても続行（オプショナル認証のため）
        next();
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireManager,
    optionalAuth
};
