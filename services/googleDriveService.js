const { google } = require('googleapis');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { Event, Municipality, DevelopmentArea } = require('../models');

class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.sheets = null;
        this.auth = null;
        this.initialized = false;
    }

    /**
     * Google Drive APIの認証を初期化
     */
    async initialize() {
        try {
            // サービスアカウントキーファイルのパスを確認
            const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ||
                path.join(__dirname, '../config/google-service-account.json');

            if (!fs.existsSync(keyFilePath)) {
                console.warn('Google Service Account key file not found. Google Drive integration disabled.');
                return false;
            }

            // Google認証の設定
            this.auth = new google.auth.GoogleAuth({
                keyFile: keyFilePath,
                scopes: [
                    'https://www.googleapis.com/auth/drive',
                    'https://www.googleapis.com/auth/spreadsheets'
                ]
            });

            // Google Drive API クライアントを初期化
            this.drive = google.drive({ version: 'v3', auth: this.auth });
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });

            this.initialized = true;
            console.log('✅ Google Drive integration initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Google Drive integration:', error.message);
            return false;
        }
    }

    /**
     * 認証状態を確認
     */
    checkInitialization() {
        if (!this.initialized) {
            throw new Error('Google Drive service not initialized. Call initialize() first.');
        }
    }

    /**
     * 地域別集計データを生成
     */
    async generateRegionalSummaryData() {
        try {
            console.log('📊 地域別集計データを生成中...');

            // 地域別のイベント統計を取得
            const regionalStats = await Event.findAll({
                attributes: [
                    'eventStatus',
                    'eventYear',
                    'eventMonth',
                    [Event.sequelize.fn('COUNT', Event.sequelize.col('Event.id')), 'eventCount'],
                    [Event.sequelize.fn('SUM', Event.sequelize.col('lineCount')), 'totalLineCount']
                ],
                include: [{
                    model: Municipality,
                    as: 'Municipality',
                    attributes: ['region', 'prefectureName'],
                    required: true
                }],
                group: [
                    'Municipality.region',
                    'Municipality.prefectureName',
                    'eventStatus',
                    'eventYear',
                    'eventMonth'
                ],
                order: [
                    ['Municipality', 'region', 'ASC'],
                    ['Municipality', 'prefectureName', 'ASC'],
                    ['eventYear', 'DESC'],
                    ['eventMonth', 'DESC']
                ]
            });

            // 開拓地域別の統計を取得
            const developmentAreaStats = await DevelopmentArea.findAll({
                attributes: [
                    'name',
                    'targetLineCount',
                    'currentLineCount',
                    'developmentStatus',
                    'priority'
                ],
                order: [['priority', 'DESC'], ['name', 'ASC']]
            });

            // 市区町村統計を取得
            const municipalityStats = await Municipality.findAll({
                attributes: [
                    'region',
                    'prefectureName',
                    [Municipality.sequelize.fn('COUNT', Municipality.sequelize.col('id')), 'municipalityCount']
                ],
                group: ['region', 'prefectureName'],
                order: [['region', 'ASC'], ['prefectureName', 'ASC']]
            });

            return {
                regionalStats: regionalStats.map(stat => ({
                    region: stat.Municipality.region,
                    prefecture: stat.Municipality.prefectureName,
                    status: stat.eventStatus,
                    year: stat.eventYear,
                    month: stat.eventMonth,
                    eventCount: parseInt(stat.dataValues.eventCount) || 0,
                    totalLineCount: parseInt(stat.dataValues.totalLineCount) || 0
                })),
                developmentAreaStats: developmentAreaStats.map(area => ({
                    name: area.name,
                    targetLineCount: area.targetLineCount,
                    currentLineCount: area.currentLineCount,
                    developmentStatus: area.developmentStatus,
                    priority: area.priority,
                    progressRate: area.targetLineCount > 0 ?
                        Math.round((area.currentLineCount / area.targetLineCount) * 100) : 0
                })),
                municipalityStats: municipalityStats.map(stat => ({
                    region: stat.region,
                    prefecture: stat.prefectureName,
                    municipalityCount: parseInt(stat.dataValues.municipalityCount) || 0
                }))
            };

        } catch (error) {
            console.error('❌ 地域別集計データ生成エラー:', error);
            throw error;
        }
    }

    /**
     * Excelファイルを作成
     */
    async createExcelReport(data, fileName = 'regional_summary_report.xlsx') {
        try {
            console.log('📝 Excelレポートを作成中...');

            const workbook = new ExcelJS.Workbook();

            // メタデータ設定
            workbook.creator = 'CPC管理システム';
            workbook.lastModifiedBy = 'CPC管理システム';
            workbook.created = new Date();
            workbook.modified = new Date();

            // 1. 地域別イベント統計シート
            const eventsSheet = workbook.addWorksheet('地域別イベント統計');
            eventsSheet.columns = [
                { header: '地方', key: 'region', width: 12 },
                { header: '都道府県', key: 'prefecture', width: 15 },
                { header: 'ステータス', key: 'status', width: 12 },
                { header: '年', key: 'year', width: 8 },
                { header: '月', key: 'month', width: 8 },
                { header: 'イベント数', key: 'eventCount', width: 12 },
                { header: '総ライン数', key: 'totalLineCount', width: 15 }
            ];

            data.regionalStats.forEach(row => {
                eventsSheet.addRow(row);
            });

            // ヘッダーのスタイリング
            eventsSheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            });

            // 2. 開拓地域統計シート
            const areasSheet = workbook.addWorksheet('開拓地域統計');
            areasSheet.columns = [
                { header: '開拓地域名', key: 'name', width: 20 },
                { header: '目標ライン数', key: 'targetLineCount', width: 15 },
                { header: '現在ライン数', key: 'currentLineCount', width: 15 },
                { header: '進捗率(%)', key: 'progressRate', width: 12 },
                { header: '開拓状況', key: 'developmentStatus', width: 15 },
                { header: '優先度', key: 'priority', width: 10 }
            ];

            data.developmentAreaStats.forEach(row => {
                areasSheet.addRow(row);
            });

            areasSheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            });

            // 3. 市区町村統計シート
            const municipalitiesSheet = workbook.addWorksheet('市区町村統計');
            municipalitiesSheet.columns = [
                { header: '地方', key: 'region', width: 12 },
                { header: '都道府県', key: 'prefecture', width: 15 },
                { header: '市区町村数', key: 'municipalityCount', width: 15 }
            ];

            data.municipalityStats.forEach(row => {
                municipalitiesSheet.addRow(row);
            });

            municipalitiesSheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            });

            // 4. サマリーシート
            const summarySheet = workbook.addWorksheet('サマリー', { state: 'visible' });

            // サマリーデータの計算
            const totalEvents = data.regionalStats.reduce((sum, item) => sum + item.eventCount, 0);
            const totalLineCount = data.regionalStats.reduce((sum, item) => sum + item.totalLineCount, 0);
            const totalMunicipalities = data.municipalityStats.reduce((sum, item) => sum + item.municipalityCount, 0);
            const totalDevelopmentAreas = data.developmentAreaStats.length;

            summarySheet.addRow(['CPC管理システム 地域別集計レポート']);
            summarySheet.addRow(['生成日時', new Date().toLocaleString('ja-JP')]);
            summarySheet.addRow([]);
            summarySheet.addRow(['総合統計']);
            summarySheet.addRow(['総イベント数', totalEvents]);
            summarySheet.addRow(['総ライン数', totalLineCount]);
            summarySheet.addRow(['登録市区町村数', totalMunicipalities]);
            summarySheet.addRow(['開拓地域数', totalDevelopmentAreas]);

            // サマリーシートのスタイリング
            summarySheet.getCell('A1').font = { size: 16, bold: true };
            summarySheet.getCell('A4').font = { size: 14, bold: true };

            // ファイルを保存
            const filePath = path.join(__dirname, '../temp', fileName);

            // tempディレクトリが存在しない場合は作成
            const tempDir = path.dirname(filePath);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            await workbook.xlsx.writeFile(filePath);
            console.log(`✅ Excelレポートを作成しました: ${filePath}`);

            return filePath;

        } catch (error) {
            console.error('❌ Excelレポート作成エラー:', error);
            throw error;
        }
    }

    /**
     * Googleドライブにファイルをアップロード
     */
    async uploadToDrive(filePath, fileName, folderId = null) {
        try {
            this.checkInitialization();

            console.log(`📤 Googleドライブにアップロード中: ${fileName}`);

            const fileMetadata = {
                name: fileName,
                parents: folderId ? [folderId] : undefined
            };

            const media = {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                body: fs.createReadStream(filePath)
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name,webViewLink'
            });

            console.log(`✅ アップロード完了: ${response.data.name}`);
            console.log(`🔗 ファイルリンク: ${response.data.webViewLink}`);

            return {
                fileId: response.data.id,
                fileName: response.data.name,
                webViewLink: response.data.webViewLink
            };

        } catch (error) {
            console.error('❌ Googleドライブアップロードエラー:', error);
            throw error;
        }
    }

    /**
     * 月次レポートを生成してGoogleドライブにアップロード
     */
    async generateMonthlyReport() {
        try {
            console.log('🚀 月次レポート生成を開始します...');

            if (!this.initialized) {
                console.log('⚠️  Google Drive未初期化のため、ローカル保存のみ実行します');
            }

            // 集計データを生成
            const data = await this.generateRegionalSummaryData();

            // Excelファイルを作成
            const now = new Date();
            const fileName = `CPC地域別集計レポート_${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月.xlsx`;
            const filePath = await this.createExcelReport(data, fileName);

            let uploadResult = null;

            // Google Driveにアップロード（初期化済みの場合のみ）
            if (this.initialized) {
                try {
                    uploadResult = await this.uploadToDrive(filePath, fileName);
                } catch (uploadError) {
                    console.warn('⚠️  Googleドライブアップロードに失敗しましたが、ローカルファイルは作成されました:', uploadError.message);
                }
            }

            // 一時ファイルを削除
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('🗑️  一時ファイルを削除しました');
            }

            console.log('🎉 月次レポート生成が完了しました！');

            return {
                success: true,
                fileName,
                localPath: filePath,
                driveInfo: uploadResult,
                dataStats: {
                    eventsCount: data.regionalStats.length,
                    areasCount: data.developmentAreaStats.length,
                    municipalitiesCount: data.municipalityStats.length
                }
            };

        } catch (error) {
            console.error('❌ 月次レポート生成エラー:', error);
            throw error;
        }
    }

    /**
     * フォルダを作成または取得
     */
    async createOrGetFolder(folderName, parentFolderId = null) {
        try {
            this.checkInitialization();

            // 既存フォルダを検索
            const searchQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const searchParams = {
                q: parentFolderId ? `${searchQuery} and '${parentFolderId}' in parents` : searchQuery,
                fields: 'files(id, name)'
            };

            const searchResult = await this.drive.files.list(searchParams);

            if (searchResult.data.files.length > 0) {
                console.log(`📁 既存フォルダを使用: ${folderName}`);
                return searchResult.data.files[0].id;
            }

            // フォルダを新規作成
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: parentFolderId ? [parentFolderId] : undefined
            };

            const createResult = await this.drive.files.create({
                resource: folderMetadata,
                fields: 'id, name'
            });

            console.log(`📁 新規フォルダを作成: ${folderName}`);
            return createResult.data.id;

        } catch (error) {
            console.error('❌ フォルダ作成/取得エラー:', error);
            throw error;
        }
    }
}

module.exports = new GoogleDriveService();
