const express = require('express');
const { Municipality, Event, sequelize } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// 市区町村一覧取得
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10000, // デフォルトを10000に
            search,
            prefectureName,
            region,
            isActive = true
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { prefectureName: { [Op.like]: `%${search}%` } }
            ];
        }

        if (prefectureName) whereClause.prefectureName = prefectureName;
        if (region) whereClause.region = region;
        if (isActive !== undefined) whereClause.isActive = isActive === 'true';

        const { count, rows } = await Municipality.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['priority', 'DESC'], ['prefectureName', 'ASC'], ['name', 'ASC']]
        });

        res.json({
            municipalities: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching municipalities:', error);
        res.status(500).json({ error: 'Failed to fetch municipalities' });
    }
});

// 市区町村詳細取得
router.get('/:id', async (req, res) => {
    try {
        const municipality = await Municipality.findByPk(req.params.id, {
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

        if (!municipality) {
            return res.status(404).json({ error: 'Municipality not found' });
        }

        res.json(municipality);
    } catch (error) {
        console.error('Error fetching municipality:', error);
        res.status(500).json({ error: 'Failed to fetch municipality' });
    }
});

// 市区町村新規作成
router.post('/', async (req, res) => {
    try {
        const municipality = await Municipality.create(req.body);
        res.status(201).json(municipality);
    } catch (error) {
        console.error('Error creating municipality:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({ error: 'Failed to create municipality' });
    }
});

// 市区町村更新
router.put('/:id', async (req, res) => {
    try {
        const municipality = await Municipality.findByPk(req.params.id);
        if (!municipality) {
            return res.status(404).json({ error: 'Municipality not found' });
        }

        await municipality.update(req.body);
        res.json(municipality);
    } catch (error) {
        console.error('Error updating municipality:', error);
        res.status(500).json({ error: 'Failed to update municipality' });
    }
});

// 市区町村削除
router.delete('/:id', async (req, res) => {
    try {
        const municipality = await Municipality.findByPk(req.params.id);
        if (!municipality) {
            return res.status(404).json({ error: 'Municipality not found' });
        }

        // 関連する開催予定があるかチェック
        const eventCount = await Event.count({
            where: { municipalityId: req.params.id }
        });

        if (eventCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete municipality with associated events'
            });
        }

        await municipality.destroy();
        res.json({ message: 'Municipality deleted successfully' });
    } catch (error) {
        console.error('Error deleting municipality:', error);
        res.status(500).json({ error: 'Failed to delete municipality' });
    }
});

// 都道府県別市区町村取得
router.get('/prefecture/:prefectureName', async (req, res) => {
    try {
        const municipalities = await Municipality.findAll({
            where: {
                prefectureName: req.params.prefectureName,
                isActive: true
            },
            order: [['priority', 'DESC'], ['name', 'ASC']]
        });

        res.json(municipalities);
    } catch (error) {
        console.error('Error fetching municipalities by prefecture:', error);
        res.status(500).json({ error: 'Failed to fetch municipalities' });
    }
});

module.exports = router;
