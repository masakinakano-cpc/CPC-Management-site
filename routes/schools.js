const express = require('express');
const { School, Event, sequelize } = require('../models');
const { Op } = require('sequelize');
const router = express.Router();

// 学校一覧取得
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            prefectureName,
            cityName,
            schoolType,
            isActive = true
        } = req.query;

        const offset = (page - 1) * limit;
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { schoolName: { [Op.like]: `%${search}%` } },
                { address: { [Op.like]: `%${search}%` } }
            ];
        }

        if (prefectureName) whereClause.prefectureName = prefectureName;
        if (cityName) whereClause.cityName = cityName;
        if (schoolType) whereClause.schoolType = schoolType;
        if (isActive !== undefined) whereClause.isActive = isActive === 'true';

        const { count, rows } = await School.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['prefectureName', 'ASC'], ['cityName', 'ASC'], ['schoolName', 'ASC']]
        });

        res.json({
            schools: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).json({ error: 'Failed to fetch schools' });
    }
});

// 学校詳細取得
router.get('/:id', async (req, res) => {
    try {
        const school = await School.findByPk(req.params.id, {
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

        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        res.json(school);
    } catch (error) {
        console.error('Error fetching school:', error);
        res.status(500).json({ error: 'Failed to fetch school' });
    }
});

// 学校新規作成
router.post('/', async (req, res) => {
    try {
        const school = await School.create(req.body);
        res.status(201).json(school);
    } catch (error) {
        console.error('Error creating school:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                errors: error.errors.map(e => e.message)
            });
        }
        res.status(500).json({ error: 'Failed to create school' });
    }
});

// 学校更新
router.put('/:id', async (req, res) => {
    try {
        const school = await School.findByPk(req.params.id);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        await school.update(req.body);
        res.json(school);
    } catch (error) {
        console.error('Error updating school:', error);
        res.status(500).json({ error: 'Failed to update school' });
    }
});

// 学校削除
router.delete('/:id', async (req, res) => {
    try {
        const school = await School.findByPk(req.params.id);
        if (!school) {
            return res.status(404).json({ error: 'School not found' });
        }

        await school.destroy();
        res.json({ message: 'School deleted successfully' });
    } catch (error) {
        console.error('Error deleting school:', error);
        res.status(500).json({ error: 'Failed to delete school' });
    }
});

module.exports = router;
