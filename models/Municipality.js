const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Municipality = sequelize.define('Municipality', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            comment: '市区町村ID'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: '市区町村名'
        },
        prefectureName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '都道府県名'
        },
        region: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '地方名（関東、関西など）'
        },
        populationCategory: {
            type: DataTypes.ENUM('大都市', '中核市', '地方都市', '町村'),
            allowNull: true,
            comment: '人口規模カテゴリ'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '有効フラグ'
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '優先度（数値が大きいほど優先）'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '備考'
        }
    }, {
        tableName: 'municipalities',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [
            {
                fields: ['prefectureName']
            },
            {
                fields: ['region']
            },
            {
                fields: ['isActive']
            },
            {
                fields: ['priority']
            }
        ]
    });

    // インスタンスメソッド
    Municipality.prototype.getFullName = function () {
        return `${this.prefectureName}${this.name}`;
    };

    Municipality.prototype.getDisplayName = function () {
        return this.region ? `${this.name}（${this.region}）` : this.name;
    };

    // クラスメソッド
    Municipality.findByPrefecture = function (prefectureName) {
        return this.findAll({
            where: {
                prefectureName: prefectureName,
                isActive: true
            },
            order: [['priority', 'DESC'], ['name', 'ASC']]
        });
    };

    Municipality.findByRegion = function (region) {
        return this.findAll({
            where: {
                region: region,
                isActive: true
            },
            order: [['priority', 'DESC'], ['name', 'ASC']]
        });
    };

    return Municipality;
};
