const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const School = sequelize.define('School', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            comment: '小学校ID'
        },
        schoolName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '小学校名'
        },
        schoolCode: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
            comment: '小学校コード'
        },
        prefectureName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '都道府県名'
        },
        cityName: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '市区町村名'
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '住所'
        },
        postalCode: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '郵便番号'
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '電話番号'
        },
        studentCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '生徒数'
        },
        classCount: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'クラス数'
        },
        schoolType: {
            type: DataTypes.ENUM('公立', '私立', '国立'),
            allowNull: true,
            comment: '学校種別'
        },
        establishmentYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '設立年'
        },
        principalName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '校長名'
        },
        contactPersonName: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: '連絡担当者名'
        },
        contactEmail: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true
            },
            comment: '連絡先メールアドレス'
        },
        websiteUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true
            },
            comment: 'ウェブサイトURL'
        },
        hasGym: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '体育館有無'
        },
        hasAuditorium: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '講堂有無'
        },
        gymCapacity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '体育館収容人数'
        },
        accessInfo: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: 'アクセス情報'
        },
        parkingInfo: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '駐車場情報'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '備考'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '有効フラグ'
        },
        isTargetSchool: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '対象校フラグ'
        },
        lastContactDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '最終連絡日'
        }
    }, {
        tableName: 'schools',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        indexes: [
            {
                fields: ['prefectureName']
            },
            {
                fields: ['cityName']
            },
            {
                fields: ['schoolType']
            },
            {
                fields: ['isActive']
            },
            {
                fields: ['isTargetSchool']
            },
            {
                fields: ['hasGym']
            },
            {
                fields: ['hasAuditorium']
            },
            {
                fields: ['studentCount']
            }
        ]
    });

    // インスタンスメソッド
    School.prototype.getDisplayName = function () {
        return this.schoolCode ? `${this.schoolName}（${this.schoolCode}）` : this.schoolName;
    };

    School.prototype.getFullAddress = function () {
        return `${this.prefectureName}${this.cityName}${this.address || ''}`;
    };

    School.prototype.getStudentPerClass = function () {
        if (!this.studentCount || !this.classCount) return 0;
        return Math.round(this.studentCount / this.classCount);
    };

    School.prototype.getSchoolAge = function () {
        if (!this.establishmentYear) return null;
        return new Date().getFullYear() - this.establishmentYear;
    };

    School.prototype.getDaysSinceLastContact = function () {
        if (!this.lastContactDate) return null;

        const now = new Date();
        const lastContact = new Date(this.lastContactDate);
        const diffTime = now - lastContact;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    School.prototype.hasEventCapability = function () {
        return this.hasGym || this.hasAuditorium;
    };

    School.prototype.getCapacityInfo = function () {
        if (this.gymCapacity) {
            return `体育館: ${this.gymCapacity}人`;
        }
        if (this.hasAuditorium) {
            return '講堂あり';
        }
        if (this.hasGym) {
            return '体育館あり';
        }
        return '施設情報なし';
    };

    // クラスメソッド
    School.findByPrefecture = function (prefectureName) {
        return this.findAll({
            where: {
                prefectureName: prefectureName,
                isActive: true
            },
            order: [['cityName', 'ASC'], ['schoolName', 'ASC']]
        });
    };

    School.findByCity = function (cityName) {
        return this.findAll({
            where: {
                cityName: cityName,
                isActive: true
            },
            order: [['schoolName', 'ASC']]
        });
    };

    School.findWithEventCapability = function () {
        return this.findAll({
            where: {
                [sequelize.Op.or]: [
                    { hasGym: true },
                    { hasAuditorium: true }
                ],
                isActive: true
            },
            order: [['gymCapacity', 'DESC'], ['studentCount', 'DESC']]
        });
    };

    School.findTargetSchools = function () {
        return this.findAll({
            where: {
                isTargetSchool: true,
                isActive: true
            },
            order: [['prefectureName', 'ASC'], ['cityName', 'ASC'], ['schoolName', 'ASC']]
        });
    };

    School.findByType = function (schoolType) {
        return this.findAll({
            where: {
                schoolType: schoolType,
                isActive: true
            },
            order: [['prefectureName', 'ASC'], ['cityName', 'ASC'], ['schoolName', 'ASC']]
        });
    };

    return School;
};
