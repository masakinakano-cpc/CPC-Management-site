const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DevelopmentArea = sequelize.define('DevelopmentArea', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            comment: '開拓地域ID'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: '開拓地域名'
        },
        code: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            comment: '地域コード'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '地域の説明'
        },
        targetLineCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '目標ライン数'
        },
        currentLineCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '現在のライン数'
        },
        managerName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '担当者名'
        },
        contactInfo: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '連絡先情報'
        },
        developmentStatus: {
            type: DataTypes.ENUM('未着手', '開拓中', '安定稼働', '休止中'),
            allowNull: false,
            defaultValue: '未着手',
            comment: '開拓ステータス'
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '優先度'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '有効フラグ'
        },
        lastEventDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '最終開催日'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '備考'
        }
    }, {
        tableName: 'development_areas',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [
            {
                fields: ['developmentStatus']
            },
            {
                fields: ['priority']
            },
            {
                fields: ['isActive']
            },
            {
                fields: ['lastEventDate']
            }
        ]
    });

    // インスタンスメソッド
    DevelopmentArea.prototype.getAchievementRate = function () {
        if (!this.targetLineCount || this.targetLineCount === 0) return 0;
        return Math.round((this.currentLineCount / this.targetLineCount) * 100);
    };

    DevelopmentArea.prototype.getRemainingLines = function () {
        if (!this.targetLineCount) return 0;
        return Math.max(0, this.targetLineCount - this.currentLineCount);
    };

    DevelopmentArea.prototype.getDisplayName = function () {
        return this.code ? `${this.name}（${this.code}）` : this.name;
    };

    DevelopmentArea.prototype.getDaysSinceLastEvent = function () {
        if (!this.lastEventDate) return null;

        const now = new Date();
        const lastEvent = new Date(this.lastEventDate);
        const diffTime = now - lastEvent;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    // クラスメソッド
    DevelopmentArea.findByStatus = function (status) {
        return this.findAll({
            where: {
                developmentStatus: status,
                isActive: true
            },
            order: [['priority', 'DESC'], ['name', 'ASC']]
        });
    };

    DevelopmentArea.findHighPriority = function () {
        return this.findAll({
            where: {
                priority: { [sequelize.Op.gt]: 0 },
                isActive: true
            },
            order: [['priority', 'DESC'], ['name', 'ASC']]
        });
    };

    return DevelopmentArea;
};
