const express = require('express');
const { VenueHistory, Event, sequelize } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// 実施リスト一覧取得
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            venueType,
            eventResult,
            isActive = true
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { venueName: { [Op.like]: `%${search}%` } },
                { address: { [Op.like]: `%${search}%` } }
            ];
        }

        if (venueType) whereClause.venueType = venueType;
        if (eventResult) whereClause.eventResult = eventResult;
        if (isActive !== undefined) whereClause.isActive = isActive === 'true';

        const { count, rows } = await VenueHistory.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['lastUsedDate', 'DESC'], ['venueName', 'ASC']]
        });

        res.json({
            venueHistories: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching venue histories:', error);
        res.status(500).json({ error: 'Failed to fetch venue histories' });
    }
});

// 実施リスト詳細取得
router.get('/:id', async (req, res) => {
    try {
        const venueHistory = await VenueHistory.findByPk(req.params.id, {
            include: [
                {
                    model: Event,
                    as: 'events',
                    attributes: ['id', 'eventYear', 'eventMonth', 'lineCount', 'eventStatus'],
                    limit: 10,
                    order: [['eventYear', 'DESC'], ['eventMonth', 'DESC']]
                }
            ]
        });

        if (!venueHistory) {
            return res.status(404).json({ error: 'Venue history not found' });
        }

        res.json(venueHistory);
    } catch (error) {
        console.error('Error fetching venue history:', error);
        res.status(500).json({ error: 'Failed to fetch venue history' });
    }
});

// 実施リスト新規作成
router.post('/', async (req, res) => {
    try {
        const venueHistory = await VenueHistory.create(req.body);
        res.status(201).json(venueHistory);
    } catch (error) {
        console.error('Error creating venue history:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({ error: 'Failed to create venue history' });
    }
});

// 実施リスト更新
router.put('/:id', async (req, res) => {
    try {
        const venueHistory = await VenueHistory.findByPk(req.params.id);
        if (!venueHistory) {
            return res.status(404).json({ error: 'Venue history not found' });
        }

        await venueHistory.update(req.body);
        res.json(venueHistory);
    } catch (error) {
        console.error('Error updating venue history:', error);
        res.status(500).json({ error: 'Failed to update venue history' });
    }
});

// 実施リスト削除
router.delete('/:id', async (req, res) => {
    try {
        const venueHistory = await VenueHistory.findByPk(req.params.id);
        if (!venueHistory) {
            return res.status(404).json({ error: 'Venue history not found' });
        }

        await venueHistory.destroy();
        res.json({ message: 'Venue history deleted successfully' });
    } catch (error) {
        console.error('Error deleting venue history:', error);
        res.status(500).json({ error: 'Failed to delete venue history' });
    }
});

// 推奨会場取得
router.get('/recommended/list', async (req, res) => {
    try {
        const venueHistories = await VenueHistory.findAll({
            where: {
                isRecommended: true,
                isActive: true
            },
            order: [['satisfaction', 'DESC'], ['venueName', 'ASC']]
        });

        res.json(venueHistories);
    } catch (error) {
        console.error('Error fetching recommended venues:', error);
        res.status(500).json({ error: 'Failed to fetch recommended venues' });
    }
});

module.exports = router;
