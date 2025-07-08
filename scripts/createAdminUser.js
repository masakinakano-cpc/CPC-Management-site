const { User, connectDatabase } = require('../models');

const createAdminUser = async () => {
    try {
        // データベース接続
        await connectDatabase();

        // 管理者ユーザーの情報
        const adminUser = {
            username: 'admin',
            email: 'admin@cpc-management.com',
            password: 'admin123',
            firstName: '管理者',
            lastName: 'ユーザー',
            role: 'admin',
            isActive: true
        };

        // 既存の管理者ユーザーをチェック
        const existingAdmin = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { username: adminUser.username },
                    { email: adminUser.email }
                ]
            }
        });

        if (existingAdmin) {
            console.log('管理者ユーザーは既に存在します。');
            console.log('ユーザー名:', existingAdmin.username);
            console.log('メールアドレス:', existingAdmin.email);
            return;
        }

        // 管理者ユーザーを作成
        const user = await User.create(adminUser);

        console.log('✅ 管理者ユーザーが正常に作成されました！');
        console.log('ユーザー名:', user.username);
        console.log('メールアドレス:', user.email);
        console.log('ロール:', user.role);
        console.log('');
        console.log('⚠️  セキュリティのため、本番環境では必ずパスワードを変更してください。');

    } catch (error) {
        console.error('❌ 管理者ユーザーの作成に失敗しました:', error);
    } finally {
        // データベース接続を閉じる
        const { sequelize } = require('../models');
        await sequelize.close();
        process.exit(0);
    }
};

// スクリプト実行
createAdminUser();
