const express = require('express');
const { Event, Municipality, DevelopmentArea, VenueHistory, School, sequelize } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// 開催予定一覧取得
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            eventYear,
            eventMonth,
            eventStatus
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { remarks: { [Op.like]: `%${search}%` } }
            ];
        }

        if (eventYear) whereClause.eventYear = eventYear;
        if (eventMonth) whereClause.eventMonth = eventMonth;
        if (eventStatus) whereClause.eventStatus = eventStatus;

        const { count, rows } = await Event.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Municipality,
                    as: 'Municipality',
                    attributes: ['id', 'name', 'prefectureName', 'region']
                },
                {
                    model: DevelopmentArea,
                    as: 'DevelopmentArea',
                    attributes: ['id', 'name', 'code'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['eventYear', 'DESC'], ['eventMonth', 'DESC']],
            distinct: true
        });

        res.json({
            events: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// 開催予定詳細取得
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id, {
            include: [
                {
                    model: Municipality,
                    as: 'Municipality'
                },
                {
                    model: DevelopmentArea,
                    as: 'DevelopmentArea',
                    required: false
                }
            ]
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
    }
});

// 開催予定新規作成
router.post('/', async (req, res) => {
    try {
        const event = await Event.create(req.body);

        const eventWithRelations = await Event.findByPk(event.id, {
            include: [
                {
                    model: Municipality,
                    as: 'Municipality'
                }
            ]
        });

        res.status(201).json(eventWithRelations);
    } catch (error) {
        console.error('Error creating event:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// 開催予定更新
router.put('/:id', async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await event.update(req.body);

        const updatedEvent = await Event.findByPk(event.id, {
            include: [
                {
                    model: Municipality,
                    as: 'Municipality'
                }
            ]
        });

        res.json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
});

// 開催予定削除
router.delete('/:id', async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await event.destroy();
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

// 統計情報取得
router.get('/stats/summary', async (req, res) => {
    try {
        const totalEvents = await Event.count();

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

        const statusStats = await Event.findAll({
            attributes: [
                'eventStatus',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['eventStatus']
        });

        res.json({
            totalEvents,
            monthlyLines,
            statusStats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
