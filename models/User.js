const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            validate: {
                len: [3, 50]
            }
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'manager', 'user'),
            defaultValue: 'user',
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        lastLoginAt: {
            type: DataTypes.DATE
        },
        passwordResetToken: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['username']
            },
            {
                unique: true,
                fields: ['email']
            },
            {
                fields: ['role']
            },
            {
                fields: ['isActive']
            }
        ]
    });

    // パスワードハッシュ化のフック
    User.beforeCreate(async (user) => {
        if (user.password) {
            const bcrypt = require('bcryptjs');
            user.password = await bcrypt.hash(user.password, 12);
        }
    });

    User.beforeUpdate(async (user) => {
        if (user.changed('password')) {
            const bcrypt = require('bcryptjs');
            user.password = await bcrypt.hash(user.password, 12);
        }
    });

    // インスタンスメソッド
    User.prototype.comparePassword = async function (candidatePassword) {
        const bcrypt = require('bcryptjs');
        return await bcrypt.compare(candidatePassword, this.password);
    };

    User.prototype.toJSON = function () {
        const values = Object.assign({}, this.get());
        delete values.password;
        delete values.passwordResetToken;
        delete values.passwordResetExpires;
        return values;
    };

    return User;
};
