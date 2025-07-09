const { sequelize, User } = require('../models');
const bcrypt = require('bcrypt');

(async () => {
    try {
        await sequelize.authenticate();
        const hash = await bcrypt.hash('admin123', 10);
        const [user, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                email: 'admin@cpc.com',
                password: hash,
                role: 'admin',
                firstName: '管理',
                lastName: '者',
                isActive: true
            }
        });
        if (!created) {
            await user.update({
                password: hash,
                isActive: true,
                email: 'admin@cpc.com',
                role: 'admin',
                firstName: '管理',
                lastName: '者'
            });
            console.log('既存のadminユーザーを上書きしました（パスワード: admin123, isActive: true）');
        } else {
            console.log('adminユーザーを新規作成しました（パスワード: admin123, isActive: true）');
        }
        process.exit(0);
    } catch (err) {
        console.error('adminユーザー作成/上書き中にエラー:', err);
        process.exit(1);
    }
})();
