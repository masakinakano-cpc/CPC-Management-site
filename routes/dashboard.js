const express = require('express');
const { Event, Municipality, DevelopmentArea, VenueHistory, School, sequelize } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// ダッシュボード統計取得
router.get('/stats', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // 基本統計
        const totalEvents = await Event.count();
        const totalMunicipalities = await Municipality.count({ where: { isActive: true } });
        const totalDevelopmentAreas = await DevelopmentArea.count({ where: { isActive: true } });
        const totalVenues = await VenueHistory.count({ where: { isActive: true } });

        // 今年の統計
        const thisYearEvents = await Event.count({
            where: { eventYear: currentYear }
        });

        const thisYearLines = await Event.sum('lineCount', {
            where: { eventYear: currentYear }
        });

        // 今月の統計
        const thisMonthEvents = await Event.count({
            where: {
                eventYear: currentYear,
                eventMonth: currentMonth
            }
        });

        // 来月の予定
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

        const nextMonthEvents = await Event.count({
            where: {
                eventYear: nextMonthYear,
                eventMonth: nextMonth
            }
        });

        // ステータス別統計
        const statusStats = await Event.findAll({
            attributes: [
                'eventStatus',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['eventStatus']
        });

        // 月別ライン数（過去12ヶ月）
        const monthlyLines = await Event.findAll({
            attributes: [
                'eventYear',
                'eventMonth',
                [sequelize.fn('SUM', sequelize.col('lineCount')), 'totalLines']
            ],
            group: ['eventYear', 'eventMonth'],
            order: [['eventYear', 'DESC'], ['eventMonth', 'DESC']],
            limit: 12
        });

        // 開催地別統計（上位10件）
        const locationStats = await Event.findAll({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('Event.id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('Event.lineCount')), 'totalLines']
            ],
            include: [
                {
                    model: Municipality,
                    as: 'municipality',
                    attributes: ['name', 'prefectureName']
                }
            ],
            group: ['municipality.id'],
            order: [[sequelize.fn('COUNT', sequelize.col('Event.id')), 'DESC']],
            limit: 10
        });

        // 開拓地域の進捗
        const developmentProgress = await DevelopmentArea.findAll({
            attributes: [
                'name',
                'targetLineCount',
                'currentLineCount',
                'developmentStatus'
            ],
            where: {
                isActive: true,
                targetLineCount: { [Op.not]: null }
            },
            order: [['priority', 'DESC']]
        });

        res.json({
            basicStats: {
                totalEvents,
                totalMunicipalities,
                totalDevelopmentAreas,
                totalVenues,
                thisYearEvents,
                thisYearLines: thisYearLines || 0,
                thisMonthEvents,
                nextMonthEvents
            },
            statusStats,
            monthlyLines,
            locationStats,
            developmentProgress
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// 通知対象イベント取得
router.get('/notifications', async (req, res) => {
    try {
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // チラシ配布日が近いイベント
        const upcomingFlyerEvents = await Event.findAll({
            where: {
                flyerDistributionStartDate: {
                    [Op.between]: [now, oneWeekFromNow]
                }
            },
            include: [
                {
                    model: Municipality,
                    as: 'municipality',
                    attributes: ['name', 'prefectureName']
                }
            ],
            order: [['flyerDistributionStartDate', 'ASC']]
        });

        // 開催日が近いイベント
        const upcomingEvents = await Event.findAll({
            where: {
                eventYear: now.getFullYear(),
                eventMonth: { [Op.gte]: now.getMonth() + 1 },
                eventStatus: ['企画中', '準備中']
            },
            include: [
                {
                    model: Municipality,
                    as: 'municipality',
                    attributes: ['name', 'prefectureName']
                }
            ],
            order: [['eventYear', 'ASC'], ['eventMonth', 'ASC']],
            limit: 10
        });

        res.json({
            upcomingFlyerEvents,
            upcomingEvents
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// 最近の活動
router.get('/recent-activity', async (req, res) => {
    try {
        const recentEvents = await Event.findAll({
            include: [
                {
                    model: Municipality,
                    as: 'municipality',
                    attributes: ['name', 'prefectureName']
                }
            ],
            order: [['updatedAt', 'DESC']],
            limit: 10
        });

        res.json(recentEvents);
    } catch (error) {
        console.error('Error fetching recent activity:', error);
        res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
});

module.exports = router;
