const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const VenueHistory = sequelize.define('VenueHistory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            comment: '実施リストID'
        },
        venueName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '会場名'
        },
        venueCode: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            comment: '会場コード'
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '住所'
        },
        capacity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '収容人数'
        },
        venueType: {
            type: DataTypes.ENUM('学校', '公民館', '体育館', 'ホール', 'その他'),
            allowNull: true,
            comment: '会場タイプ'
        },
        implementationDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '実施日'
        },
        participantCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '参加者数'
        },
        linesUsed: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '使用ライン数'
        },
        eventResult: {
            type: DataTypes.ENUM('成功', '普通', '課題あり', '失敗'),
            allowNull: true,
            comment: '実施結果'
        },
        satisfaction: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1,
                max: 5
            },
            comment: '満足度（1-5）'
        },
        contactPersonName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '担当者名'
        },
        contactInfo: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '連絡先'
        },
        accessInfo: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'アクセス情報'
        },
        facilitiesInfo: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '設備情報'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '備考・特記事項'
        },
        isRecommended: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '推奨会場フラグ'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '有効フラグ'
        },
        lastUsedDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '最終使用日'
        }
    }, {
        tableName: 'venue_histories',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [
            {
                fields: ['venueType']
            },
            {
                fields: ['eventResult']
            },
            {
                fields: ['isRecommended']
            },
            {
                fields: ['isActive']
            },
            {
                fields: ['implementationDate']
            },
            {
                fields: ['lastUsedDate']
            }
        ]
    });

    // インスタンスメソッド
    VenueHistory.prototype.getDisplayName = function () {
        return this.venueCode ? `${this.venueName}（${this.venueCode}）` : this.venueName;
    };

    VenueHistory.prototype.getSuccessRate = function () {
        // 成功率を計算（簡易版）
        if (this.eventResult === '成功') return 100;
        if (this.eventResult === '普通') return 75;
        if (this.eventResult === '課題あり') return 50;
        if (this.eventResult === '失敗') return 25;
        return 0;
    };

    VenueHistory.prototype.getDaysSinceLastUse = function () {
        if (!this.lastUsedDate) return null;

        const now = new Date();
        const lastUse = new Date(this.lastUsedDate);
        const diffTime = now - lastUse;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    VenueHistory.prototype.getCapacityUtilization = function () {
        if (!this.capacity || !this.participantCount) return 0;
        return Math.round((this.participantCount / this.capacity) * 100);
    };

    VenueHistory.prototype.getFormattedAddress = function () {
        return this.address || '住所不明';
    };

    // クラスメソッド
    VenueHistory.findByType = function (venueType) {
        return this.findAll({
            where: {
                venueType: venueType,
                isActive: true
            },
            order: [['lastUsedDate', 'DESC'], ['venueName', 'ASC']]
        });
    };

    VenueHistory.findRecommended = function () {
        return this.findAll({
            where: {
                isRecommended: true,
                isActive: true
            },
            order: [['satisfaction', 'DESC'], ['venueName', 'ASC']]
        });
    };

    VenueHistory.findByResult = function (eventResult) {
        return this.findAll({
            where: {
                eventResult: eventResult,
                isActive: true
            },
            order: [['implementationDate', 'DESC']]
        });
    };

    return VenueHistory;
};
