const { connectDatabase } = require('../models');
const { Municipality } = require('../models');

// 都道府県から地域を決定するマッピング
const prefectureToRegionMapping = {
    // 関東地方
    '東京都': '関東',
    '神奈川県': '関東',
    '千葉県': '関東',
    '埼玉県': '関東',
    '茨城県': '関東',
    '栃木県': '関東',
    '群馬県': '関東',

    // 関西地方
    '大阪府': '関西',
    '京都府': '関西',
    '兵庫県': '関西',
    '奈良県': '関西',
    '和歌山県': '関西',
    '滋賀県': '関西',

    // 中部地方
    '愛知県': '中部',
    '静岡県': '中部',
    '岐阜県': '中部',
    '三重県': '中部',
    '長野県': '中部',
    '山梨県': '中部',
    '新潟県': '中部',
    '富山県': '中部',
    '石川県': '中部',
    '福井県': '中部',

    // 九州地方
    '福岡県': '九州',
    '佐賀県': '九州',
    '長崎県': '九州',
    '熊本県': '九州',
    '大分県': '九州',
    '宮崎県': '九州',
    '鹿児島県': '九州',
    '沖縄県': '九州',

    // 東北地方
    '宮城県': '東北',
    '青森県': '東北',
    '岩手県': '東北',
    '秋田県': '東北',
    '山形県': '東北',
    '福島県': '東北',

    // 中国地方
    '広島県': '中国',
    '岡山県': '中国',
    '鳥取県': '中国',
    '島根県': '中国',
    '山口県': '中国',

    // 四国地方
    '香川県': '四国',
    '愛媛県': '四国',
    '徳島県': '四国',
    '高知県': '四国',

    // 北海道
    '北海道': '北海道'
};

// 地域データ更新実行関数
const updateRegionalData = async () => {
    try {
        console.log('🚀 地域データ更新を開始します...');

        // データベース接続
        await connectDatabase();
        console.log('✅ データベースに接続しました');

        // 全ての市区町村データを取得
        const municipalities = await Municipality.findAll({
            attributes: ['id', 'name', 'prefectureName', 'region']
        });

        console.log(`📊 対象の市区町村数: ${municipalities.length}`);

        let updateCount = 0;
        let updatePromises = [];

        // 各市区町村のregionを更新
        for (const municipality of municipalities) {
            const correctRegion = prefectureToRegionMapping[municipality.prefectureName];

            if (correctRegion && municipality.region !== correctRegion) {
                const updatePromise = Municipality.update(
                    { region: correctRegion },
                    { where: { id: municipality.id } }
                );
                updatePromises.push(updatePromise);
                updateCount++;

                console.log(`🔄 ${municipality.name}（${municipality.prefectureName}）: "${municipality.region || '未設定'}" → "${correctRegion}"`);
            }
        }

        // バッチ更新実行
        if (updatePromises.length > 0) {
            console.log(`💾 ${updatePromises.length}件のデータを更新中...`);
            await Promise.all(updatePromises);
            console.log(`✅ ${updateCount}件の地域データを更新しました`);
        } else {
            console.log('ℹ️  更新が必要なデータはありません');
        }

        // 更新後の統計確認
        console.log('\n📈 更新後の地域別統計:');
        const regionalStats = await Municipality.findAll({
            attributes: [
                'region',
                [Municipality.sequelize.fn('COUNT', Municipality.sequelize.col('id')), 'count']
            ],
            group: ['region'],
            order: [['region', 'ASC']]
        });

        regionalStats.forEach(stat => {
            console.log(`   ${stat.region || '未設定'}: ${stat.dataValues.count}件`);
        });

        // 都道府県別の詳細統計
        console.log('\n📍 都道府県別統計:');
        const prefectureStats = await Municipality.findAll({
            attributes: [
                'prefectureName',
                'region',
                [Municipality.sequelize.fn('COUNT', Municipality.sequelize.col('id')), 'count']
            ],
            group: ['prefectureName', 'region'],
            order: [['region', 'ASC'], ['prefectureName', 'ASC']]
        });

        let currentRegion = '';
        prefectureStats.forEach(stat => {
            if (stat.region !== currentRegion) {
                if (currentRegion !== '') console.log('');
                console.log(`【${stat.region}地方】`);
                currentRegion = stat.region;
            }
            console.log(`   ${stat.prefectureName}: ${stat.dataValues.count}件`);
        });

        console.log('\n🎉 地域データ更新が完了しました！');

    } catch (error) {
        console.error('❌ 地域データ更新中にエラーが発生しました:', error);
        throw error;
    }
};

// スクリプト実行
if (require.main === module) {
    updateRegionalData()
        .then(() => {
            console.log('🏁 プロセスを終了します');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { updateRegionalData, prefectureToRegionMapping };
