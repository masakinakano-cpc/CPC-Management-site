const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
    try {
        // データベース接続
        const { connectDatabase } = require('../models');
        await connectDatabase();

        // 管理者ユーザーの情報
        const adminUser = {
            username: 'admin',
            email: 'admin@cpc.com',
            password: 'admin123',
            firstName: '管理者',
            lastName: 'CPC',
            role: 'admin',
            isActive: true
        };

        // 既存のユーザーをチェック
        const existingUser = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { username: adminUser.username },
                    { email: adminUser.email }
                ]
            }
        });

        if (existingUser) {
            console.log('管理者ユーザーは既に存在します');
            console.log('ユーザー名:', existingUser.username);
            console.log('メール:', existingUser.email);
            console.log('役割:', existingUser.role);
            return;
        }

        // パスワードハッシュ化
        const hashedPassword = await bcrypt.hash(adminUser.password, 12);

        // ユーザー作成
        const user = await User.create({
            ...adminUser,
            password: hashedPassword
        });

        console.log('✅ 管理者ユーザーが正常に作成されました');
        console.log('ユーザー名:', user.username);
        console.log('メール:', user.email);
        console.log('役割:', user.role);
        console.log('ID:', user.id);

        // データベース接続を閉じる
        await require('../models').sequelize.close();

    } catch (error) {
        console.error('❌ 管理者ユーザー作成エラー:', error);
        process.exit(1);
    }
}

// スクリプト実行
if (require.main === module) {
    createAdminUser();
}

module.exports = createAdminUser;
