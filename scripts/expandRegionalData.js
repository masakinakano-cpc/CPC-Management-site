const { connectDatabase } = require('../models');
const { Municipality } = require('../models');

// 拡張する地域データ
const expandedMunicipalityData = [
    // 大阪府の追加市町村
    { name: '東大阪市', prefectureName: '大阪府', region: '関西', populationCategory: '大都市', isActive: true },
    { name: '豊中市', prefectureName: '大阪府', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '枚方市', prefectureName: '大阪府', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '吹田市', prefectureName: '大阪府', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '高槻市', prefectureName: '大阪府', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '茨木市', prefectureName: '大阪府', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '八尾市', prefectureName: '大阪府', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '寝屋川市', prefectureName: '大阪府', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '岸和田市', prefectureName: '大阪府', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '和泉市', prefectureName: '大阪府', region: '関西', populationCategory: '地方都市', isActive: true },

    // 兵庫県の追加市町村
    { name: '姫路市', prefectureName: '兵庫県', region: '関西', populationCategory: '大都市', isActive: true },
    { name: '尼崎市', prefectureName: '兵庫県', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '明石市', prefectureName: '兵庫県', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '西宮市', prefectureName: '兵庫県', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '宝塚市', prefectureName: '兵庫県', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '伊丹市', prefectureName: '兵庫県', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '加古川市', prefectureName: '兵庫県', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '川西市', prefectureName: '兵庫県', region: '関西', populationCategory: '地方都市', isActive: true },

    // 奈良県の市町村
    { name: '奈良市', prefectureName: '奈良県', region: '関西', populationCategory: '中核市', isActive: true },
    { name: '橿原市', prefectureName: '奈良県', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '生駒市', prefectureName: '奈良県', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '大和郡山市', prefectureName: '奈良県', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '香芝市', prefectureName: '奈良県', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '天理市', prefectureName: '奈良県', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '大和高田市', prefectureName: '奈良県', region: '関西', populationCategory: '地方都市', isActive: true },

    // 京都府の追加市町村
    { name: '宇治市', prefectureName: '京都府', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '亀岡市', prefectureName: '京都府', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '城陽市', prefectureName: '京都府', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '向日市', prefectureName: '京都府', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '長岡京市', prefectureName: '京都府', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '木津川市', prefectureName: '京都府', region: '関西', populationCategory: '地方都市', isActive: true },
    { name: '八幡市', prefectureName: '京都府', region: '関西', populationCategory: '地方都市', isActive: true },

    // 愛知県の追加市町村
    { name: '豊橋市', prefectureName: '愛知県', region: '中部', populationCategory: '中核市', isActive: true },
    { name: '岡崎市', prefectureName: '愛知県', region: '中部', populationCategory: '中核市', isActive: true },
    { name: '一宮市', prefectureName: '愛知県', region: '中部', populationCategory: '中核市', isActive: true },
    { name: '瀬戸市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '半田市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '春日井市', prefectureName: '愛知県', region: '中部', populationCategory: '中核市', isActive: true },
    { name: '豊川市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '津島市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '碧南市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '刈谷市', prefectureName: '愛知県', region: '中部', populationCategory: '中核市', isActive: true },
    { name: '安城市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '西尾市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '蒲郡市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '犬山市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '常滑市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '江南市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '小牧市', prefectureName: '愛知県', region: '中部', populationCategory: '中核市', isActive: true },
    { name: '稲沢市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '新城市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '東海市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '大府市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '知多市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '知立市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '尾張旭市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '高浜市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '岩倉市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '豊明市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '日進市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '田原市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '愛西市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '清須市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '北名古屋市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '弥富市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: 'みよし市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: 'あま市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true },
    { name: '長久手市', prefectureName: '愛知県', region: '中部', populationCategory: '地方都市', isActive: true }
];

// 地域データ拡張実行関数
const expandRegionalData = async () => {
    try {
        console.log('🚀 地域データ拡張を開始します...');

        // データベース接続
        await connectDatabase();
        console.log('✅ データベースに接続しました');

        // 既存の市区町村データを確認
        const existingMunicipalities = await Municipality.findAll({
            attributes: ['name', 'prefectureName']
        });

        const existingNames = existingMunicipalities.map(m => `${m.name}-${m.prefectureName}`);
        console.log(`📊 既存の市区町村数: ${existingNames.length}`);

        // 重複チェックして新しいデータのみ追加
        const newMunicipalities = expandedMunicipalityData.filter(municipality => {
            const key = `${municipality.name}-${municipality.prefectureName}`;
            return !existingNames.includes(key);
        });

        if (newMunicipalities.length === 0) {
            console.log('ℹ️  追加する新しい市区町村データはありません');
            return;
        }

        console.log(`📋 追加予定の市区町村数: ${newMunicipalities.length}`);

        // 地域別の集計
        const summary = {};
        newMunicipalities.forEach(municipality => {
            const prefecture = municipality.prefectureName;
            if (!summary[prefecture]) {
                summary[prefecture] = 0;
            }
            summary[prefecture]++;
        });

        console.log('📍 地域別追加数:');
        Object.entries(summary).forEach(([prefecture, count]) => {
            console.log(`   ${prefecture}: ${count}件`);
        });

        // データベースに挿入
        console.log('💾 データベースに挿入中...');
        const createdMunicipalities = await Municipality.bulkCreate(newMunicipalities, {
            ignoreDuplicates: true,
            returning: true
        });

        console.log(`✅ ${createdMunicipalities.length}件の市区町村データを追加しました`);

        // 最終確認
        const totalMunicipalities = await Municipality.count();
        console.log(`📊 総市区町村数: ${totalMunicipalities}`);

        // 地域別統計
        console.log('\n📈 地域別統計:');
        const regionalStats = await Municipality.findAll({
            attributes: [
                'region',
                [Municipality.sequelize.fn('COUNT', Municipality.sequelize.col('id')), 'count']
            ],
            group: ['region'],
            order: [['region', 'ASC']]
        });

        regionalStats.forEach(stat => {
            console.log(`   ${stat.region}: ${stat.dataValues.count}件`);
        });

        console.log('\n🎉 地域データ拡張が完了しました！');

    } catch (error) {
        console.error('❌ 地域データ拡張中にエラーが発生しました:', error);
        throw error;
    }
};

// スクリプト実行
if (require.main === module) {
    expandRegionalData()
        .then(() => {
            console.log('🏁 プロセスを終了します');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 致命的エラー:', error);
            process.exit(1);
        });
}

module.exports = { expandRegionalData, expandedMunicipalityData };
