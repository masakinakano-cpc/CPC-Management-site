const { sequelize, User } = require('../models');
const bcrypt = require('bcrypt');

(async () => {
    try {
        await sequelize.authenticate();
        const hash = await bcrypt.hash('admin123', 10);
        const [updated] = await User.update({ password: hash }, { where: { username: 'admin' } });
        if (updated) {
            console.log('adminユーザーのパスワードをadmin123にリセットしました');
        } else {
            console.log('adminユーザーが見つかりませんでした');
        }
        process.exit(0);
    } catch (err) {
        console.error('パスワードリセット中にエラー:', err);
        process.exit(1);
    }
})();
