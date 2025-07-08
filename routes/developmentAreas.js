const express = require('express');
const { DevelopmentArea, Event, sequelize } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// 開拓地域一覧取得
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            developmentStatus,
            isActive = true
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }

        if (developmentStatus) whereClause.developmentStatus = developmentStatus;
        if (isActive !== undefined) whereClause.isActive = isActive === 'true';

        const { count, rows } = await DevelopmentArea.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['priority', 'DESC'], ['name', 'ASC']]
        });

        res.json({
            developmentAreas: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching development areas:', error);
        res.status(500).json({ error: 'Failed to fetch development areas' });
    }
});

// 開拓地域詳細取得
router.get('/:id', async (req, res) => {
    try {
        const developmentArea = await DevelopmentArea.findByPk(req.params.id, {
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

        if (!developmentArea) {
            return res.status(404).json({ error: 'Development area not found' });
        }

        res.json(developmentArea);
    } catch (error) {
        console.error('Error fetching development area:', error);
        res.status(500).json({ error: 'Failed to fetch development area' });
    }
});

// 開拓地域新規作成
router.post('/', async (req, res) => {
    try {
        const developmentArea = await DevelopmentArea.create(req.body);
        res.status(201).json(developmentArea);
    } catch (error) {
        console.error('Error creating development area:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({ error: 'Failed to create development area' });
    }
});

// 開拓地域更新
router.put('/:id', async (req, res) => {
    try {
        const developmentArea = await DevelopmentArea.findByPk(req.params.id);
        if (!developmentArea) {
            return res.status(404).json({ error: 'Development area not found' });
        }

        await developmentArea.update(req.body);
        res.json(developmentArea);
    } catch (error) {
        console.error('Error updating development area:', error);
        res.status(500).json({ error: 'Failed to update development area' });
    }
});

// 開拓地域削除
router.delete('/:id', async (req, res) => {
    try {
        const developmentArea = await DevelopmentArea.findByPk(req.params.id);
        if (!developmentArea) {
            return res.status(404).json({ error: 'Development area not found' });
        }

        await developmentArea.destroy();
        res.json({ message: 'Development area deleted successfully' });
    } catch (error) {
        console.error('Error deleting development area:', error);
        res.status(500).json({ error: 'Failed to delete development area' });
    }
});

module.exports = router;
