const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { Event, Municipality, DevelopmentArea } = require('../models');

class GoogleDriveSyncService {
    constructor() {
        this.drive = null;
        this.auth = null;
        this.initialized = false;
        this.syncFolderId = null;
        this.watcher = null;
        this.syncInterval = null;
        this.lastSyncTime = null;
    }

    /**
     * 同期サービスの初期化
     */
    async initialize() {
        try {
            // Google認証の設定
            const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ||
                path.join(__dirname, '../config/google-service-account.json');

            if (!fs.existsSync(keyFilePath)) {
                console.warn('Google Service Account key file not found. Sync service disabled.');
                return false;
            }

            this.auth = new google.auth.GoogleAuth({
                keyFile: keyFilePath,
                scopes: [
                    'https://www.googleapis.com/auth/drive',
                    'https://www.googleapis.com/auth/spreadsheets'
                ]
            });

            this.drive = google.drive({ version: 'v3', auth: this.auth });

            // 同期フォルダの作成または取得
            this.syncFolderId = await this.createOrGetSyncFolder();

            this.initialized = true;
            console.log('✅ Google Drive Sync Service initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Google Drive Sync Service:', error.message);
            return false;
        }
    }

    /**
     * 同期フォルダの作成または取得
     */
    async createOrGetSyncFolder() {
        try {
            const folderName = 'CPC管理システム_同期';

            // 既存のフォルダを検索
            const response = await this.drive.files.list({
                q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)'
            });

            if (response.data.files.length > 0) {
                return response.data.files[0].id;
            }

            // 新しいフォルダを作成
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                description: 'CPC管理システムの自動同期フォルダ'
            };

            const folder = await this.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });

            console.log(`📁 同期フォルダを作成しました: ${folderName}`);
            return folder.data.id;

        } catch (error) {
            console.error('❌ 同期フォルダの作成に失敗:', error);
            throw error;
        }
    }

    /**
     * 自動同期の開始
     */
    async startAutoSync() {
        if (!this.initialized) {
            console.warn('Sync service not initialized. Cannot start auto sync.');
            return;
        }

        // ファイル監視の開始
        this.startFileWatcher();

        // 定期同期の開始（30分ごと）
        this.syncInterval = setInterval(async () => {
            await this.performFullSync();
        }, 30 * 60 * 1000);

        console.log('🔄 自動同期を開始しました');
    }

    /**
     * 自動同期の停止
     */
    stopAutoSync() {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }

        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }

        console.log('⏹️ 自動同期を停止しました');
    }

    /**
     * ファイル監視の開始
     */
    startFileWatcher() {
        const uploadsPath = path.join(__dirname, '../uploads');

        if (!fs.existsSync(uploadsPath)) {
            fs.mkdirSync(uploadsPath, { recursive: true });
        }

        this.watcher = chokidar.watch(uploadsPath, {
            ignored: /(^|[\/\\])\../, // 隠しファイルを無視
            persistent: true,
            ignoreInitial: true
        });

        this.watcher
            .on('add', (filePath) => this.handleFileChange('add', filePath))
            .on('change', (filePath) => this.handleFileChange('change', filePath))
            .on('unlink', (filePath) => this.handleFileChange('unlink', filePath));

        console.log('👀 ファイル監視を開始しました');
    }

    /**
     * ファイル変更の処理
     */
    async handleFileChange(event, filePath) {
        try {
            console.log(`📝 ファイル変更を検知: ${event} - ${path.basename(filePath)}`);

            switch (event) {
                case 'add':
                case 'change':
                    await this.uploadFile(filePath);
                    break;
                case 'unlink':
                    await this.deleteFile(filePath);
                    break;
            }

            this.lastSyncTime = new Date();
        } catch (error) {
            console.error('❌ ファイル変更処理エラー:', error);
        }
    }

    /**
     * ファイルのアップロード
     */
    async uploadFile(filePath) {
        try {
            const fileName = path.basename(filePath);
            const fileStream = fs.createReadStream(filePath);

            // 既存ファイルの検索
            const existingFile = await this.findFileByName(fileName);

            if (existingFile) {
                // 既存ファイルを更新
                await this.drive.files.update({
                    fileId: existingFile.id,
                    media: {
                        mimeType: this.getMimeType(fileName),
                        body: fileStream
                    }
                });
                console.log(`🔄 ファイルを更新: ${fileName}`);
            } else {
                // 新しいファイルをアップロード
                const fileMetadata = {
                    name: fileName,
                    parents: [this.syncFolderId]
                };

                await this.drive.files.create({
                    resource: fileMetadata,
                    media: {
                        mimeType: this.getMimeType(fileName),
                        body: fileStream
                    },
                    fields: 'id'
                });
                console.log(`📤 ファイルをアップロード: ${fileName}`);
            }
        } catch (error) {
            console.error('❌ ファイルアップロードエラー:', error);
        }
    }

    /**
     * ファイルの削除
     */
    async deleteFile(filePath) {
        try {
            const fileName = path.basename(filePath);
            const existingFile = await this.findFileByName(fileName);

            if (existingFile) {
                await this.drive.files.delete({
                    fileId: existingFile.id
                });
                console.log(`🗑️ ファイルを削除: ${fileName}`);
            }
        } catch (error) {
            console.error('❌ ファイル削除エラー:', error);
        }
    }

    /**
     * ファイル名による検索
     */
    async findFileByName(fileName) {
        try {
            const response = await this.drive.files.list({
                q: `name='${fileName}' and '${this.syncFolderId}' in parents and trashed=false`,
                fields: 'files(id, name)'
            });

            return response.data.files.length > 0 ? response.data.files[0] : null;
        } catch (error) {
            console.error('❌ ファイル検索エラー:', error);
            return null;
        }
    }

    /**
     * 完全同期の実行
     */
    async performFullSync() {
        try {
            console.log('🔄 完全同期を開始...');

            // データベースのバックアップ
            await this.backupDatabase();

            // レポートの生成と同期
            await this.syncReports();

            // 統計データの同期
            await this.syncStatistics();

            this.lastSyncTime = new Date();
            console.log('✅ 完全同期が完了しました');

        } catch (error) {
            console.error('❌ 完全同期エラー:', error);
        }
    }

    /**
     * データベースのバックアップ
     */
    async backupDatabase() {
        try {
            const dbPath = path.join(__dirname, '../database.sqlite');
            const backupPath = path.join(__dirname, '../backups', `backup_${new Date().toISOString().split('T')[0]}.sqlite`);

            // バックアップディレクトリの作成
            const backupDir = path.dirname(backupPath);
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // データベースファイルをコピー
            fs.copyFileSync(dbPath, backupPath);

            // バックアップファイルをGoogleドライブにアップロード
            await this.uploadFile(backupPath);

            console.log('💾 データベースバックアップが完了しました');

        } catch (error) {
            console.error('❌ データベースバックアップエラー:', error);
        }
    }

    /**
     * レポートの同期
     */
    async syncReports() {
        try {
            // 月次レポートの生成と同期
            const reportService = require('./reportService');
            const reportPath = await reportService.generateMonthlyReport();

            if (reportPath && fs.existsSync(reportPath)) {
                await this.uploadFile(reportPath);
                console.log('📊 月次レポートを同期しました');
            }

        } catch (error) {
            console.error('❌ レポート同期エラー:', error);
        }
    }

    /**
     * 統計データの同期
     */
    async syncStatistics() {
        try {
            // 統計データの生成
            const stats = await this.generateStatisticsData();

            // JSONファイルとして保存
            const statsPath = path.join(__dirname, '../temp', 'statistics.json');
            const tempDir = path.dirname(statsPath);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

            // Googleドライブにアップロード
            await this.uploadFile(statsPath);

            // 一時ファイルを削除
            fs.unlinkSync(statsPath);

            console.log('📈 統計データを同期しました');

        } catch (error) {
            console.error('❌ 統計データ同期エラー:', error);
        }
    }

    /**
     * 統計データの生成
     */
    async generateStatisticsData() {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        const [
            totalEvents,
            currentMonthEvents,
            activeMunicipalities,
            totalParticipants,
            regionalStats
        ] = await Promise.all([
            Event.count(),
            Event.count({
                where: {
                    eventYear: currentYear,
                    eventMonth: currentMonth
                }
            }),
            Municipality.count({ where: { isActive: true } }),
            Event.sum('lineCount'),
            Event.findAll({
                attributes: [
                    'eventStatus',
                    [Event.sequelize.fn('COUNT', Event.sequelize.col('Event.id')), 'count']
                ],
                group: ['eventStatus']
            })
        ]);

        return {
            timestamp: currentDate.toISOString(),
            period: `${currentYear}年${currentMonth}月`,
            statistics: {
                totalEvents,
                currentMonthEvents,
                activeMunicipalities,
                totalParticipants: totalParticipants || 0,
                statusDistribution: regionalStats.map(stat => ({
                    status: stat.eventStatus,
                    count: parseInt(stat.dataValues.count)
                }))
            }
        };
    }

    /**
     * MIMEタイプの取得
     */
    getMimeType(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.json': 'application/json',
            '.sqlite': 'application/x-sqlite3',
            '.txt': 'text/plain'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    /**
     * 同期状態の取得
     */
    getSyncStatus() {
        return {
            initialized: this.initialized,
            lastSyncTime: this.lastSyncTime,
            syncFolderId: this.syncFolderId,
            isWatching: !!this.watcher,
            isIntervalActive: !!this.syncInterval
        };
    }
}

module.exports = GoogleDriveSyncService;
