const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// JWTトークン生成
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

// ユーザー登録
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, role = 'user' } = req.body;

        // バリデーション
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: '必須フィールドが不足しています'
            });
        }

        // ユーザー名とメールアドレスの重複チェック
        const existingUser = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                error: 'User already exists',
                message: 'ユーザーが既に存在します'
            });
        }

        // ユーザー作成
        const user = await User.create({
            username,
            email,
            password,
            firstName,
            lastName,
            role
        });

        // トークン生成
        const token = generateToken(user.id);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: 'Validation error',
                message: 'バリデーションエラー',
                details: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({
            error: 'Registration failed',
            message: 'ユーザー登録に失敗しました'
        });
    }
});

// ログイン
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'ユーザー名とパスワードが必要です'
            });
        }

        // ユーザー検索
        const user = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { username },
                    { email: username }
                ],
                isActive: true
            }
        });

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'ユーザー名またはパスワードが正しくありません'
            });
        }

        // パスワード検証
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'ユーザー名またはパスワードが正しくありません'
            });
        }

        // 最終ログイン日時更新
        await user.update({ lastLoginAt: new Date() });

        // トークン生成
        const token = generateToken(user.id);

        res.json({
            message: 'Login successful',
            token,
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'ログインに失敗しました'
        });
    }
});

// 現在のユーザー情報取得
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            user: req.user.toJSON()
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({
            error: 'Failed to get user info',
            message: 'ユーザー情報の取得に失敗しました'
        });
    }
});

// パスワード変更
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Missing passwords',
                message: '現在のパスワードと新しいパスワードが必要です'
            });
        }

        // 現在のパスワード検証
        const isValidPassword = await req.user.comparePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(400).json({
                error: 'Invalid current password',
                message: '現在のパスワードが正しくありません'
            });
        }

        // パスワード更新
        await req.user.update({ password: newPassword });

        res.json({
            message: 'Password changed successfully',
            message: 'パスワードが正常に変更されました'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Failed to change password',
            message: 'パスワード変更に失敗しました'
        });
    }
});

// ユーザー一覧取得（管理者のみ）
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
            order: [['createdAt', 'DESC']]
        });

        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: 'Failed to get users',
            message: 'ユーザー一覧の取得に失敗しました'
        });
    }
});

// ユーザー更新（管理者のみ）
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, role, isActive } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'ユーザーが見つかりません'
            });
        }

        await user.update({
            firstName,
            lastName,
            email,
            role,
            isActive
        });

        res.json({
            message: 'User updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            error: 'Failed to update user',
            message: 'ユーザー更新に失敗しました'
        });
    }
});

// ユーザー削除（管理者のみ）
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // 自分自身を削除できないようにする
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                error: 'Cannot delete yourself',
                message: '自分自身を削除することはできません'
            });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                message: 'ユーザーが見つかりません'
            });
        }

        await user.destroy();

        res.json({
            message: 'User deleted successfully',
            message: 'ユーザーが正常に削除されました'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            error: 'Failed to delete user',
            message: 'ユーザー削除に失敗しました'
        });
    }
});

// ログアウト（クライアント側でトークンを削除）
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        message: 'Logout successful',
        message: 'ログアウトしました'
    });
});

module.exports = router;
