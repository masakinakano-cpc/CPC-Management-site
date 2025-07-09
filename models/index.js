const { Sequelize } = require('sequelize');
const path = require('path');

// データベース接続設定
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: console.log, // 開発用。本番では false に設定
});

// モデルの定義
const Event = require('./Event')(sequelize);
const Municipality = require('./Municipality')(sequelize);
const DevelopmentArea = require('./DevelopmentArea')(sequelize);
const VenueHistory = require('./VenueHistory')(sequelize);
const School = require('./School')(sequelize);
const User = require('./User')(sequelize);

// リレーションシップの定義
Event.belongsTo(Municipality, { foreignKey: 'municipalityId', as: 'Municipality' });
Municipality.hasMany(Event, { foreignKey: 'municipalityId', as: 'events' });

Event.belongsTo(DevelopmentArea, { foreignKey: 'developmentAreaId', as: 'DevelopmentArea' });
DevelopmentArea.hasMany(Event, { foreignKey: 'developmentAreaId', as: 'events' });

Event.belongsTo(VenueHistory, { foreignKey: 'venueHistoryId', as: 'VenueHistory' });
VenueHistory.hasMany(Event, { foreignKey: 'venueHistoryId', as: 'events' });

Event.belongsTo(School, { foreignKey: 'schoolId', as: 'School' });
School.hasMany(Event, { foreignKey: 'schoolId', as: 'events' });

// ユーザー関連のリレーションシップ（将来的にイベントとユーザーの関連付けなど）

// データベース接続テスト
const connectDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('データベース接続成功');

        // テーブル作成（開発用）
        await sequelize.sync({ force: true });
        console.log('データベーステーブル同期完了');
    } catch (error) {
        console.error('データベース接続エラー:', error);
    }
};

module.exports = {
    sequelize,
    Event,
    Municipality,
    DevelopmentArea,
    VenueHistory,
    School,
    User,
    connectDatabase
};
