const { connectDatabase } = require('../models');
const {
    Event,
    Municipality,
    DevelopmentArea,
    VenueHistory,
    School
} = require('../models');
const fs = require('fs');
const path = require('path');

// 開拓地域データ
const developmentAreaData = [
    {
        name: '東京都心部',
        description: '新宿・渋谷・港区エリアの開拓',
        targetLineCount: 500,
        currentLineCount: 320,
        priority: 5,
        developmentStatus: '開拓中',
        isActive: true
    },
    {
        name: '神奈川県央',
        description: '横浜・川崎・相模原エリアの開拓',
        targetLineCount: 400,
        currentLineCount: 280,
        priority: 4,
        developmentStatus: '開拓中',
        isActive: true
    },
    {
        name: '関西圏',
        description: '大阪・京都・神戸エリアの開拓',
        targetLineCount: 600,
        currentLineCount: 450,
        priority: 5,
        developmentStatus: '開拓中',
        isActive: true
    },
    {
        name: '愛知県内',
        description: '名古屋・豊田エリアの開拓',
        targetLineCount: 300,
        currentLineCount: 180,
        priority: 3,
        developmentStatus: '企画中',
        isActive: true
    },
    {
        name: '九州北部',
        description: '福岡・北九州エリアの開拓',
        targetLineCount: 250,
        currentLineCount: 120,
        priority: 3,
        developmentStatus: '企画中',
        isActive: true
    }
];

// 会場履歴データ
const venueHistoryData = [
    {
        venueName: '新宿文化センター',
        address: '東京都新宿区新宿6-14-1',
        capacity: 1800,
        venueType: '文化会館',
        lastUsedDate: new Date('2024-01-15'),
        eventResult: '大成功',
        satisfaction: 5,
        isRecommended: true,
        isActive: true
    },
    {
        venueName: '渋谷区民会館',
        address: '東京都渋谷区宇田川町1-1',
        capacity: 1200,
        venueType: '区民会館',
        lastUsedDate: new Date('2024-02-20'),
        eventResult: '成功',
        satisfaction: 4,
        isRecommended: true,
        isActive: true
    },
    {
        venueName: '横浜みなとみらいホール',
        address: '神奈川県横浜市西区みなとみらい2-3-6',
        capacity: 2000,
        venueType: 'コンサートホール',
        lastUsedDate: new Date('2024-03-10'),
        eventResult: '大成功',
        satisfaction: 5,
        isRecommended: true,
        isActive: true
    },
    {
        venueName: '川崎市産業振興会館',
        address: '神奈川県川崎市幸区堀川町66-20',
        capacity: 800,
        venueType: '産業会館',
        lastUsedDate: new Date('2024-01-28'),
        eventResult: '普通',
        satisfaction: 3,
        isRecommended: false,
        isActive: true
    },
    {
        venueName: '大阪府立国際会議場',
        address: '大阪府大阪市住之江区南港北1-5-102',
        capacity: 3000,
        venueType: '国際会議場',
        lastUsedDate: new Date('2024-02-15'),
        eventResult: '大成功',
        satisfaction: 5,
        isRecommended: true,
        isActive: true
    }
];

// 学校データ
const schoolData = [
    {
        schoolName: '新宿区立四谷小学校',
        address: '東京都新宿区四谷2-6',
        prefectureName: '東京都',
        cityName: '新宿区',
        studentCount: 450,
        schoolType: '公立小学校',
        hasGym: true,
        hasAuditorium: true,
        isActive: true
    },
    {
        schoolName: '渋谷区立原宿外苑中学校',
        address: '東京都渋谷区神宮前2-18-12',
        prefectureName: '東京都',
        cityName: '渋谷区',
        studentCount: 380,
        schoolType: '公立中学校',
        hasGym: true,
        hasAuditorium: false,
        isActive: true
    },
    {
        schoolName: '横浜市立みなとみらい本町小学校',
        address: '神奈川県横浜市西区みなとみらい3-3-3',
        prefectureName: '神奈川県',
        cityName: '横浜市',
        studentCount: 520,
        schoolType: '公立小学校',
        hasGym: true,
        hasAuditorium: true,
        isActive: true
    },
    {
        schoolName: '川崎市立宮前小学校',
        address: '神奈川県川崎市宮前区宮前平2-20-1',
        prefectureName: '神奈川県',
        cityName: '川崎市',
        studentCount: 340,
        schoolType: '公立小学校',
        hasGym: true,
        hasAuditorium: false,
        isActive: true
    },
    {
        schoolName: '大阪市立住之江小学校',
        address: '大阪府大阪市住之江区住之江1-1-58',
        prefectureName: '大阪府',
        cityName: '大阪市',
        studentCount: 290,
        schoolType: '公立小学校',
        hasGym: true,
        hasAuditorium: true,
        isActive: true
    }
];

// 開催予定データ生成関数
const generateEventData = (municipalities, developmentAreas, venueHistories, schools) => {
    const eventData = [];
    const statuses = ['企画中', '準備中', '実施済み', '過去開催'];

    // 2024年のイベントデータ
    for (let month = 1; month <= 12; month++) {
        const eventsInMonth = Math.floor(Math.random() * 5) + 2; // 2-6件/月

        for (let i = 0; i < eventsInMonth; i++) {
            const municipality = municipalities[Math.floor(Math.random() * municipalities.length)];
            const developmentArea = developmentAreas[Math.floor(Math.random() * developmentAreas.length)];
            const venueHistory = venueHistories[Math.floor(Math.random() * venueHistories.length)];
            const school = schools[Math.floor(Math.random() * schools.length)];

            const lineCount = Math.floor(Math.random() * 50) + 10; // 10-59ライン
            const status = month < 4 ? '実施済み' : month < 8 ? '準備中' : '企画中';

            // チラシ配布開始日（開催予定日の2週間前）
            const eventDate = new Date(2024, month - 1, Math.floor(Math.random() * 28) + 1);
            const flyerDate = new Date(eventDate);
            flyerDate.setDate(flyerDate.getDate() - 14);

            eventData.push({
                eventYear: 2024,
                eventMonth: month,
                lineCount: lineCount,
                eventStatus: status,
                flyerDistributionStartDate: flyerDate,
                venue: venueHistory.venueName,
                notes: `${municipality.name}での開催予定`,
                isActive: true,
                municipalityId: municipality.id,
                developmentAreaId: developmentArea.id,
                venueHistoryId: venueHistory.id,
                schoolId: school.id
            });
        }
    }

    return eventData;
};

// データベースシード実行
const seedDatabase = async () => {
    try {
        console.log('🌱 データベースシード開始...');

        // データベース接続
        await connectDatabase();

        // 既存データの削除
        console.log('🧹 既存データの削除...');
        await Event.destroy({ where: {} });
        await Municipality.destroy({ where: {} });
        await DevelopmentArea.destroy({ where: {} });
        await VenueHistory.destroy({ where: {} });
        await School.destroy({ where: {} });

        // 市区町村データ挿入
        console.log('📍 市区町村データ挿入...');
        const municipalitiesSeedPath = path.join(__dirname, '../seed/municipalities_seed.json');
        let municipalityData = [];
        try {
            const raw = fs.readFileSync(municipalitiesSeedPath, 'utf-8');
            const json = JSON.parse(raw);
            // モデルのカラムに合わせて変換
            municipalityData = json.map(item => ({
                name: item.name,
                prefectureName: item.prefectureName,
                regionName: '', // 必要に応じて空文字や自動判定
                populationCategory: '', // 必要に応じて空文字や自動判定
                isActive: true
            }));
        } catch (err) {
            console.error('市区町村seedデータの読み込みに失敗しました:', err);
        }
        const municipalities = await Municipality.bulkCreate(municipalityData, { ignoreDuplicates: true });
        console.log(`✅ ${municipalities.length}件の市区町村データを挿入しました`);

        // 開拓地域データ挿入
        console.log('🏗️ 開拓地域データ挿入...');
        const developmentAreas = await DevelopmentArea.bulkCreate(developmentAreaData);
        console.log(`✅ ${developmentAreas.length}件の開拓地域データを挿入しました`);

        // 会場履歴データ挿入
        console.log('🏛️ 会場履歴データ挿入...');
        const venueHistories = await VenueHistory.bulkCreate(venueHistoryData);
        console.log(`✅ ${venueHistories.length}件の会場履歴データを挿入しました`);

        // 学校データ挿入
        console.log('🏫 学校データ挿入...');
        const schools = await School.bulkCreate(schoolData);
        console.log(`✅ ${schools.length}件の学校データを挿入しました`);

        // 開催予定データ生成・挿入
        console.log('📅 開催予定データ生成・挿入...');
        const eventData = generateEventData(municipalities, developmentAreas, venueHistories, schools);
        const events = await Event.bulkCreate(eventData);
        console.log(`✅ ${events.length}件の開催予定データを挿入しました`);

        console.log('🎉 データベースシード完了！');

        // 統計情報表示
        const totalEvents = await Event.count();
        const totalMunicipalities = await Municipality.count();
        const totalDevelopmentAreas = await DevelopmentArea.count();
        const totalVenueHistories = await VenueHistory.count();
        const totalSchools = await School.count();

        console.log('\n📊 挿入データ統計:');
        console.log(`- 開催予定: ${totalEvents}件`);
        console.log(`- 市区町村: ${totalMunicipalities}件`);
        console.log(`- 開拓地域: ${totalDevelopmentAreas}件`);
        console.log(`- 会場履歴: ${totalVenueHistories}件`);
        console.log(`- 学校: ${totalSchools}件`);

        process.exit(0);
    } catch (error) {
        console.error('❌ データベースシードエラー:', error);
        process.exit(1);
    }
};

// スクリプト実行
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
