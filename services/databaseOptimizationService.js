const { sequelize, Event, Municipality, DevelopmentArea, VenueHistory, School, User } = require('../models');
const fs = require('fs');
const path = require('path');
const { QueryTypes } = require('sequelize');

class DatabaseOptimizationService {
    constructor() {
        this.optimizationHistory = [];
        this.performanceMetrics = [];
    }

    /**
     * データベース最適化の実行
     */
    async performOptimization() {
        try {
            console.log('🔧 データベース最適化を開始...');

            const results = {
                indexes: await this.optimizeIndexes(),
                queries: await this.optimizeQueries(),
                cleanup: await this.performCleanup(),
                backup: await this.createBackup(),
                analysis: await this.analyzePerformance()
            };

            this.optimizationHistory.push({
                timestamp: new Date(),
                results
            });

            console.log('✅ データベース最適化が完了しました');
            return results;

        } catch (error) {
            console.error('❌ データベース最適化エラー:', error);
            throw error;
        }
    }

    /**
     * インデックス最適化
     */
    async optimizeIndexes() {
        try {
            console.log('📊 インデックス最適化を実行中...');

            const results = {
                created: [],
                analyzed: [],
                recommendations: []
            };

            // 既存のインデックスを分析
            const existingIndexes = await this.getExistingIndexes();
            console.log('既存インデックス:', existingIndexes);

            // 推奨インデックスの確認と作成
            const recommendedIndexes = this.getRecommendedIndexes();

            for (const index of recommendedIndexes) {
                if (!this.indexExists(existingIndexes, index)) {
                    try {
                        await this.createIndex(index);
                        results.created.push(index);
                        console.log(`✅ インデックスを作成: ${index.name}`);
                    } catch (error) {
                        console.warn(`⚠️ インデックス作成失敗: ${index.name}`, error.message);
                    }
                }
            }

            // インデックス使用状況の分析
            const indexUsage = await this.analyzeIndexUsage();
            results.analyzed = indexUsage;

            // 未使用インデックスの特定
            const unusedIndexes = this.identifyUnusedIndexes(existingIndexes, indexUsage);
            results.recommendations = unusedIndexes;

            return results;

        } catch (error) {
            console.error('❌ インデックス最適化エラー:', error);
            throw error;
        }
    }

    /**
     * 既存インデックスの取得
     */
    async getExistingIndexes() {
        const indexes = await sequelize.query(`
            SELECT
                name,
                tbl_name as table_name,
                sql
            FROM sqlite_master
            WHERE type = 'index'
            AND name NOT LIKE 'sqlite_autoindex_%'
        `, { type: QueryTypes.SELECT });

        return indexes;
    }

    /**
     * 推奨インデックスの定義
     */
    getRecommendedIndexes() {
        return [
            // イベントテーブル
            {
                name: 'idx_events_year_month',
                table: 'events',
                columns: ['eventYear', 'eventMonth'],
                type: 'BTREE'
            },
            {
                name: 'idx_events_status_date',
                table: 'events',
                columns: ['eventStatus', 'eventDate'],
                type: 'BTREE'
            },
            {
                name: 'idx_events_municipality_status',
                table: 'events',
                columns: ['municipalityId', 'eventStatus'],
                type: 'BTREE'
            },
            {
                name: 'idx_events_flyer_date',
                table: 'events',
                columns: ['flyerDistributionStartDate'],
                type: 'BTREE'
            },

            // 市区町村テーブル
            {
                name: 'idx_municipalities_region_active',
                table: 'municipalities',
                columns: ['region', 'isActive'],
                type: 'BTREE'
            },
            {
                name: 'idx_municipalities_prefecture_priority',
                table: 'municipalities',
                columns: ['prefectureName', 'priority'],
                type: 'BTREE'
            },

            // 開拓地域テーブル
            {
                name: 'idx_development_areas_status_priority',
                table: 'development_areas',
                columns: ['developmentStatus', 'priority'],
                type: 'BTREE'
            },
            {
                name: 'idx_development_areas_active_date',
                table: 'development_areas',
                columns: ['isActive', 'lastEventDate'],
                type: 'BTREE'
            },

            // 会場履歴テーブル
            {
                name: 'idx_venue_histories_type_result',
                table: 'venue_histories',
                columns: ['venueType', 'eventResult'],
                type: 'BTREE'
            },
            {
                name: 'idx_venue_histories_recommended_active',
                table: 'venue_histories',
                columns: ['isRecommended', 'isActive'],
                type: 'BTREE'
            },

            // 学校テーブル
            {
                name: 'idx_schools_prefecture_city',
                table: 'schools',
                columns: ['prefectureName', 'cityName'],
                type: 'BTREE'
            },
            {
                name: 'idx_schools_type_target',
                table: 'schools',
                columns: ['schoolType', 'isTargetSchool'],
                type: 'BTREE'
            },

            // ユーザーテーブル
            {
                name: 'idx_users_role_active',
                table: 'users',
                columns: ['role', 'isActive'],
                type: 'BTREE'
            },
            {
                name: 'idx_users_last_login',
                table: 'users',
                columns: ['lastLoginAt'],
                type: 'BTREE'
            }
        ];
    }

    /**
     * インデックスの存在確認
     */
    indexExists(existingIndexes, newIndex) {
        return existingIndexes.some(index =>
            index.name === newIndex.name ||
            index.sql.includes(newIndex.columns.join(', '))
        );
    }

    /**
     * インデックスの作成
     */
    async createIndex(index) {
        const columns = index.columns.join(', ');
        const sql = `CREATE INDEX ${index.name} ON ${index.table} (${columns})`;

        await sequelize.query(sql, { type: QueryTypes.RAW });
    }

    /**
     * インデックス使用状況の分析
     */
    async analyzeIndexUsage() {
        // SQLiteでは直接的なインデックス使用統計は取得できないため、
        // クエリパフォーマンスの測定で代替
        const queries = [
            'SELECT COUNT(*) FROM events WHERE eventYear = 2025 AND eventMonth = 8',
            'SELECT * FROM events WHERE eventStatus = "confirmed" ORDER BY eventDate DESC LIMIT 10',
            'SELECT * FROM municipalities WHERE region = "関東" AND isActive = 1',
            'SELECT * FROM development_areas WHERE developmentStatus = "active" ORDER BY priority DESC'
        ];

        const results = [];
        for (const query of queries) {
            const startTime = Date.now();
            await sequelize.query(query, { type: QueryTypes.SELECT });
            const endTime = Date.now();

            results.push({
                query,
                executionTime: endTime - startTime
            });
        }

        return results;
    }

    /**
     * 未使用インデックスの特定
     */
    identifyUnusedIndexes(existingIndexes, usageAnalysis) {
        // 実際の運用では、より詳細な分析が必要
        return existingIndexes.filter(index =>
            !index.name.includes('PRIMARY') &&
            !index.name.includes('UNIQUE')
        ).map(index => ({
            name: index.name,
            table: index.table_name,
            recommendation: '使用頻度を監視して不要な場合は削除を検討'
        }));
    }

    /**
     * クエリ最適化
     */
    async optimizeQueries() {
        try {
            console.log('🔍 クエリ最適化を実行中...');

            const results = {
                slowQueries: [],
                optimizations: [],
                recommendations: []
            };

            // 遅いクエリの特定
            const slowQueries = await this.identifySlowQueries();
            results.slowQueries = slowQueries;

            // クエリ最適化の提案
            const optimizations = this.suggestQueryOptimizations(slowQueries);
            results.optimizations = optimizations;

            // 全般的な推奨事項
            results.recommendations = [
                'N+1問題を避けるため、includeを使用して関連データを事前読み込み',
                '大量データの取得時はLIMITとOFFSETを使用',
                'WHERE句でのインデックス活用を確認',
                '不要なSELECT *を避け、必要なカラムのみ取得'
            ];

            return results;

        } catch (error) {
            console.error('❌ クエリ最適化エラー:', error);
            throw error;
        }
    }

    /**
     * 遅いクエリの特定
     */
    async identifySlowQueries() {
        const testQueries = [
            {
                name: 'イベント一覧取得',
                query: 'SELECT * FROM events ORDER BY createdAt DESC LIMIT 100'
            },
            {
                name: '地域別統計',
                query: `
                    SELECT m.region, COUNT(e.id) as eventCount
                    FROM municipalities m
                    LEFT JOIN events e ON m.id = e.municipalityId
                    GROUP BY m.region
                `
            },
            {
                name: '月次イベント統計',
                query: `
                    SELECT eventYear, eventMonth, COUNT(*) as count
                    FROM events
                    GROUP BY eventYear, eventMonth
                    ORDER BY eventYear DESC, eventMonth DESC
                `
            }
        ];

        const results = [];
        for (const testQuery of testQueries) {
            const startTime = Date.now();
            await sequelize.query(testQuery.query, { type: QueryTypes.SELECT });
            const executionTime = Date.now() - startTime;

            results.push({
                name: testQuery.name,
                query: testQuery.query,
                executionTime,
                isSlow: executionTime > 100 // 100ms以上を遅いと判定
            });
        }

        return results;
    }

    /**
     * クエリ最適化の提案
     */
    suggestQueryOptimizations(slowQueries) {
        const optimizations = [];

        slowQueries.forEach(query => {
            if (query.isSlow) {
                if (query.name === 'イベント一覧取得') {
                    optimizations.push({
                        query: query.name,
                        current: query.query,
                        optimized: 'SELECT id, eventName, eventDate, eventStatus FROM events ORDER BY createdAt DESC LIMIT 100',
                        reason: '必要なカラムのみ選択してパフォーマンス向上'
                    });
                } else if (query.name === '地域別統計') {
                    optimizations.push({
                        query: query.name,
                        current: query.query,
                        optimized: `
                            SELECT m.region, COUNT(e.id) as eventCount
                            FROM municipalities m
                            INNER JOIN events e ON m.id = e.municipalityId
                            WHERE m.isActive = 1
                            GROUP BY m.region
                        `,
                        reason: 'INNER JOINとWHERE句を追加して効率化'
                    });
                }
            }
        });

        return optimizations;
    }

    /**
     * データベースクリーンアップ
     */
    async performCleanup() {
        try {
            console.log('🧹 データベースクリーンアップを実行中...');

            const results = {
                deletedRecords: 0,
                optimizedTables: [],
                freedSpace: 0
            };

            // 古いログデータの削除（30日以上前）
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // 削除されたイベントのクリーンアップ
            const deletedEvents = await Event.destroy({
                where: {
                    eventStatus: 'cancelled',
                    updatedAt: {
                        [require('sequelize').Op.lt]: thirtyDaysAgo
                    }
                }
            });

            results.deletedRecords += deletedEvents;

            // 無効なユーザーのクリーンアップ
            const deletedUsers = await User.destroy({
                where: {
                    isActive: false,
                    lastLoginAt: {
                        [require('sequelize').Op.lt]: thirtyDaysAgo
                    }
                }
            });

            results.deletedRecords += deletedUsers;

            // テーブル最適化
            const tables = ['events', 'municipalities', 'development_areas', 'venue_histories', 'schools', 'users'];
            for (const table of tables) {
                await sequelize.query(`VACUUM ${table}`, { type: QueryTypes.RAW });
                results.optimizedTables.push(table);
            }

            console.log(`✅ クリーンアップ完了: ${results.deletedRecords}件のレコードを削除`);
            return results;

        } catch (error) {
            console.error('❌ クリーンアップエラー:', error);
            throw error;
        }
    }

    /**
     * バックアップの作成
     */
    async createBackup() {
        try {
            console.log('💾 データベースバックアップを作成中...');

            const backupDir = path.join(__dirname, '../backups');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `backup_${timestamp}.sqlite`);

            // データベースファイルをコピー
            const dbPath = path.join(__dirname, '../database.sqlite');
            fs.copyFileSync(dbPath, backupPath);

            // 古いバックアップの削除（30日以上前）
            const files = fs.readdirSync(backupDir);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            files.forEach(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtime < thirtyDaysAgo) {
                    fs.unlinkSync(filePath);
                    console.log(`🗑️ 古いバックアップを削除: ${file}`);
                }
            });

            console.log(`✅ バックアップを作成: ${backupPath}`);
            return {
                path: backupPath,
                size: fs.statSync(backupPath).size,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('❌ バックアップ作成エラー:', error);
            throw error;
        }
    }

    /**
     * パフォーマンス分析
     */
    async analyzePerformance() {
        try {
            console.log('📊 パフォーマンス分析を実行中...');

            const analysis = {
                tableSizes: await this.getTableSizes(),
                queryPerformance: await this.measureQueryPerformance(),
                indexEfficiency: await this.analyzeIndexEfficiency(),
                recommendations: []
            };

            // 推奨事項の生成
            if (analysis.tableSizes.events > 10000) {
                analysis.recommendations.push('イベントテーブルが大きいため、パーティショニングを検討');
            }

            if (analysis.queryPerformance.avgExecutionTime > 50) {
                analysis.recommendations.push('クエリ実行時間が長いため、インデックスの追加を検討');
            }

            this.performanceMetrics.push({
                timestamp: new Date(),
                analysis
            });

            return analysis;

        } catch (error) {
            console.error('❌ パフォーマンス分析エラー:', error);
            throw error;
        }
    }

    /**
     * テーブルサイズの取得
     */
    async getTableSizes() {
        const tables = ['events', 'municipalities', 'development_areas', 'venue_histories', 'schools', 'users'];
        const sizes = {};

        for (const table of tables) {
            const result = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`, {
                type: QueryTypes.SELECT
            });
            sizes[table] = result[0].count;
        }

        return sizes;
    }

    /**
     * クエリパフォーマンスの測定
     */
    async measureQueryPerformance() {
        const queries = [
            'SELECT COUNT(*) FROM events',
            'SELECT * FROM events ORDER BY createdAt DESC LIMIT 10',
            'SELECT * FROM municipalities WHERE isActive = 1'
        ];

        const times = [];
        for (const query of queries) {
            const startTime = Date.now();
            await sequelize.query(query, { type: QueryTypes.SELECT });
            times.push(Date.now() - startTime);
        }

        return {
            times,
            avgExecutionTime: times.reduce((a, b) => a + b, 0) / times.length,
            maxExecutionTime: Math.max(...times),
            minExecutionTime: Math.min(...times)
        };
    }

    /**
     * インデックス効率の分析
     */
    async analyzeIndexEfficiency() {
        // SQLiteでは直接的なインデックス効率の測定は困難
        // 代わりにクエリ実行時間で判断
        const queries = [
            { name: 'インデックスあり', query: 'SELECT * FROM events WHERE eventYear = 2025 AND eventMonth = 8' },
            { name: 'インデックスなし', query: 'SELECT * FROM events WHERE notes LIKE "%test%"' }
        ];

        const results = {};
        for (const query of queries) {
            const startTime = Date.now();
            await sequelize.query(query.query, { type: QueryTypes.SELECT });
            results[query.name] = Date.now() - startTime;
        }

        return results;
    }

    /**
     * 最適化履歴の取得
     */
    getOptimizationHistory() {
        return this.optimizationHistory;
    }

    /**
     * パフォーマンスメトリクスの取得
     */
    getPerformanceMetrics() {
        return this.performanceMetrics;
    }
}

module.exports = DatabaseOptimizationService;
