const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { Event, Municipality, User } = require('../models');
const { Op } = require('sequelize');
const mailConfig = require('../config/mail');

// 通知設定の取得
router.get('/settings', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const settings = {
            mailService: mailConfig.service,
            mailUser: mailConfig.user ? '設定済み' : '未設定',
            mailPass: mailConfig.pass ? '設定済み' : '未設定',
            isConfigured: emailService.isConfigured
        };

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('通知設定取得エラー:', error);
        res.status(500).json({
            success: false,
            message: '通知設定の取得に失敗しました'
        });
    }
});

// チラシ配布通知の手動実行
router.post('/flyer-distribution', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        await emailService.sendFlyerDistributionNotification();

        res.json({
            success: true,
            message: 'チラシ配布通知を実行しました'
        });
    } catch (error) {
        console.error('チラシ配布通知エラー:', error);
        res.status(500).json({
            success: false,
            message: 'チラシ配布通知の実行に失敗しました'
        });
    }
});

// 期日過ぎ通知の手動実行
router.post('/overdue', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        await emailService.sendOverdueNotification();

        res.json({
            success: true,
            message: '期日過ぎ通知を実行しました'
        });
    } catch (error) {
        console.error('期日過ぎ通知エラー:', error);
        res.status(500).json({
            success: false,
            message: '期日過ぎ通知の実行に失敗しました'
        });
    }
});

// 3ヶ月前リマインダーの手動実行
router.post('/three-month-reminder', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        await emailService.sendThreeMonthReminder();

        res.json({
            success: true,
            message: '3ヶ月前リマインダーを実行しました'
        });
    } catch (error) {
        console.error('3ヶ月前リマインダーエラー:', error);
        res.status(500).json({
            success: false,
            message: '3ヶ月前リマインダーの実行に失敗しました'
        });
    }
});

// カスタム通知の送信
router.post('/custom', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { subject, message, recipients } = req.body;

        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: '件名とメッセージは必須です'
            });
        }

        const success = await emailService.sendCustomNotification(subject, message, recipients);

        if (success) {
            res.json({
                success: true,
                message: 'カスタム通知を送信しました'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'カスタム通知の送信に失敗しました'
            });
        }
    } catch (error) {
        console.error('カスタム通知エラー:', error);
        res.status(500).json({
            success: false,
            message: 'カスタム通知の送信に失敗しました'
        });
    }
});

// 通知対象イベントの取得
router.get('/target-events', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { type } = req.query;
        let events = [];

        switch (type) {
            case 'flyer-distribution':
                // 1週間以内にチラシ配布予定のイベント
                const today = new Date();
                const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

                events = await Event.findAll({
                    where: {
                        flyerDistributionStartDate: {
                            [Op.between]: [today, oneWeekFromNow]
                        },
                        eventStatus: ['企画中', '準備中']
                    },
                    include: [
                        {
                            model: Municipality,
                            as: 'Municipality',
                            attributes: ['name', 'prefectureName']
                        }
                    ],
                    order: [['flyerDistributionStartDate', 'ASC']]
                });
                break;

            case 'overdue':
                // 期日過ぎのイベント
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

                events = await Event.findAll({
                    where: {
                        eventYear: {
                            [Op.lte]: lastMonth.getFullYear()
                        },
                        eventMonth: {
                            [Op.lte]: lastMonth.getMonth() + 1
                        },
                        eventStatus: ['企画中', '準備中']
                    },
                    include: [
                        {
                            model: Municipality,
                            as: 'Municipality',
                            attributes: ['name', 'prefectureName']
                        }
                    ],
                    order: [['eventYear', 'ASC'], ['eventMonth', 'ASC']]
                });
                break;

            case 'three-month-reminder':
                // 3ヶ月後に開催予定のイベント
                const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, 1);

                events = await Event.findAll({
                    where: {
                        eventYear: threeMonthsFromNow.getFullYear(),
                        eventMonth: threeMonthsFromNow.getMonth() + 1,
                        eventStatus: ['企画中', '準備中']
                    },
                    include: [
                        {
                            model: Municipality,
                            as: 'Municipality',
                            attributes: ['name', 'prefectureName']
                        }
                    ],
                    order: [['eventMonth', 'ASC']]
                });
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: '無効な通知タイプです'
                });
        }

        res.json({
            success: true,
            data: {
                type,
                count: events.length,
                events: events.map(event => ({
                    id: event.id,
                    eventYear: event.eventYear,
                    eventMonth: event.eventMonth,
                    municipalityName: event.Municipality?.name || '未設定',
                    prefectureName: event.Municipality?.prefectureName || '未設定',
                    eventStatus: event.eventStatus,
                    flyerDistributionStartDate: event.flyerDistributionStartDate
                }))
            }
        });
    } catch (error) {
        console.error('通知対象イベント取得エラー:', error);
        res.status(500).json({
            success: false,
            message: '通知対象イベントの取得に失敗しました'
        });
    }
});

// 通知先ユーザーの取得
router.get('/recipients', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                isActive: true
            },
            attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'role'],
            order: [['role', 'ASC'], ['lastName', 'ASC'], ['firstName', 'ASC']]
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('通知先ユーザー取得エラー:', error);
        res.status(500).json({
            success: false,
            message: '通知先ユーザーの取得に失敗しました'
        });
    }
});

// 通知履歴の取得（簡易版）
router.get('/history', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        // 実際の実装では、通知履歴テーブルを作成して記録を保存する
        // ここでは簡易的に現在の通知設定状況を返す
        const history = {
            lastFlyerNotification: null,
            lastOverdueNotification: null,
            lastThreeMonthReminder: null,
            totalNotificationsSent: 0
        };

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('通知履歴取得エラー:', error);
        res.status(500).json({
            success: false,
            message: '通知履歴の取得に失敗しました'
        });
    }
});

// テストメール送信
router.post('/test', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'テスト用メールアドレスが必要です'
            });
        }

        const subject = '【CPC管理システム】テストメール';
        const message = 'これはCPC管理システムからのテストメールです。メール通知機能が正常に動作しています。';

        const success = await emailService.sendCustomNotification(subject, message, [email]);

        if (success) {
            res.json({
                success: true,
                message: 'テストメールを送信しました'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'テストメールの送信に失敗しました'
            });
        }
    } catch (error) {
        console.error('テストメール送信エラー:', error);
        res.status(500).json({
            success: false,
            message: 'テストメールの送信に失敗しました'
        });
    }
});

module.exports = router;
