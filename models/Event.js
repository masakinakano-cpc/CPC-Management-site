const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Event = sequelize.define('Event', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            comment: '開催ID（自動生成）'
        },
        eventYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 2020,
                max: 2050
            },
            comment: '開催年'
        },
        eventMonth: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 12
            },
            comment: '開催月'
        },
        lineCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            },
            comment: 'ライン数'
        },
        flyerDistributionStartDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: 'チラシ配布開始日'
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '備考'
        },
        eventStatus: {
            type: DataTypes.ENUM('構想', '実施予定', '準備着手中', '実施中', '実施済み', '中止'),
            allowNull: false,
            defaultValue: '構想',
            comment: '開催ステータス'
        },
        eventCount: {
            type: DataTypes.VIRTUAL,
            get() {
                // 同じ開催地での開催回数を計算（仮想フィールド）
                // 実際の計算は別途実装
                return this.getDataValue('eventCount') || 1;
            },
            comment: '開催回数（自動計算）'
        },
        // フロントエンド互換性のための仮想フィールド
        startDate: {
            type: DataTypes.VIRTUAL,
            get() {
                // eventYear, eventMonthから開始日を生成（月の1日）
                if (this.eventYear && this.eventMonth) {
                    const date = new Date(this.eventYear, this.eventMonth - 1, 1);
                    return date.toISOString().split('T')[0];
                }
                return null;
            },
            set(value) {
                // startDateが設定された場合、eventYearとeventMonthを更新
                if (value) {
                    const date = new Date(value);
                    this.setDataValue('eventYear', date.getFullYear());
                    this.setDataValue('eventMonth', date.getMonth() + 1);
                }
            },
            comment: '開始日（仮想フィールド）'
        },
        endDate: {
            type: DataTypes.VIRTUAL,
            get() {
                // eventYear, eventMonthから終了日を生成（月の最終日）
                if (this.eventYear && this.eventMonth) {
                    const date = new Date(this.eventYear, this.eventMonth, 0); // 次の月の0日 = 当月の最終日
                    return date.toISOString().split('T')[0];
                }
                return null;
            },
            set(value) {
                // endDateが設定された場合、eventYearとeventMonthを更新
                if (value) {
                    const date = new Date(value);
                    this.setDataValue('eventYear', date.getFullYear());
                    this.setDataValue('eventMonth', date.getMonth() + 1);
                }
            },
            comment: '終了日（仮想フィールド）'
        },
        // フロントエンド互換性のためのステータス仮想フィールド
        status: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.getDataValue('eventStatus');
            },
            set(value) {
                this.setDataValue('eventStatus', value);
            },
            comment: 'ステータス（仮想フィールド）'
        },
        // 外部キー
        municipalityId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'municipalities',
                key: 'id'
            },
            comment: '開催地（市区町村）のID'
        },
        developmentAreaId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'development_areas',
                key: 'id'
            },
            comment: '開拓地域のID'
        },
        venueHistoryId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'venue_histories',
                key: 'id'
            },
            comment: '実施リストのID'
        },
        schoolId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'schools',
                key: 'id'
            },
            comment: '全国小学校リストのID'
        }
    }, {
        tableName: 'events',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [
            {
                fields: ['eventYear', 'eventMonth']
            },
            {
                fields: ['municipalityId']
            },
            {
                fields: ['eventStatus']
            },
            {
                fields: ['flyerDistributionStartDate']
            }
        ],
        hooks: {
            beforeValidate: (event) => {
                // 開催年月に基づいてステータスを自動更新
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;

                // 該当月の場合（実施中に変更）
                if (event.eventYear === currentYear && event.eventMonth === currentMonth) {
                    if (['構想', '実施予定', '準備着手中'].includes(event.eventStatus)) {
                        event.eventStatus = '実施中';
                    }
                }
                // 該当月が過ぎた場合（実施済みに変更）
                else if (event.eventYear < currentYear ||
                    (event.eventYear === currentYear && event.eventMonth < currentMonth)) {
                    if (['構想', '実施予定', '準備着手中', '実施中'].includes(event.eventStatus)) {
                        event.eventStatus = '実施済み';
                    }
                }
            }
        }
    });

    // インスタンスメソッド
    Event.prototype.getFormattedDate = function () {
        return `${this.eventYear}年${this.eventMonth}月`;
    };

    Event.prototype.isUpcoming = function () {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        return this.eventYear > currentYear ||
            (this.eventYear === currentYear && this.eventMonth >= currentMonth);
    };

    Event.prototype.getDaysUntilFlyerDistribution = function () {
        if (!this.flyerDistributionStartDate) return null;

        const now = new Date();
        const flyerDate = new Date(this.flyerDistributionStartDate);
        const diffTime = flyerDate - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return Event;
};
