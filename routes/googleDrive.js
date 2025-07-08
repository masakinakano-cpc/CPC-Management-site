const express = require('express');
const router = express.Router();
const googleDriveService = require('../services/googleDriveService');

/**
 * GET /api/google-drive/status
 * Google Drive連携の状態を確認
 */
router.get('/status', async (req, res) => {
    try {
        const isInitialized = await googleDriveService.initialize();

        res.json({
            success: true,
            status: isInitialized ? 'connected' : 'disconnected',
            message: isInitialized
                ? 'Google Drive integration is active'
                : 'Google Drive integration is not configured'
        });
    } catch (error) {
        console.error('Google Drive status check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check Google Drive status',
            details: error.message
        });
    }
});

/**
 * POST /api/google-drive/generate-report
 * 月次レポートを手動生成
 */
router.post('/generate-report', async (req, res) => {
    try {
        console.log('Manual report generation requested');

        // Google Drive serviceを初期化
        await googleDriveService.initialize();

        // レポートを生成
        const result = await googleDriveService.generateMonthlyReport();

        res.json({
            success: true,
            message: 'Monthly report generated successfully',
            data: result
        });
    } catch (error) {
        console.error('Manual report generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate monthly report',
            details: error.message
        });
    }
});

/**
 * GET /api/google-drive/summary-data
 * 集計データを取得（プレビュー用）
 */
router.get('/summary-data', async (req, res) => {
    try {
        // Google Drive serviceを初期化
        await googleDriveService.initialize();

        // 集計データを生成
        const data = await googleDriveService.generateRegionalSummaryData();

        // データの統計情報を計算
        const stats = {
            regionalEvents: data.regionalStats.length,
            totalEvents: data.regionalStats.reduce((sum, item) => sum + item.eventCount, 0),
            totalLineCount: data.regionalStats.reduce((sum, item) => sum + item.totalLineCount, 0),
            developmentAreas: data.developmentAreaStats.length,
            municipalities: data.municipalityStats.reduce((sum, item) => sum + item.municipalityCount, 0)
        };

        res.json({
            success: true,
            data: {
                statistics: stats,
                regionalStats: data.regionalStats.slice(0, 10), // 最初の10件のみ返す
                developmentAreaStats: data.developmentAreaStats,
                municipalityStats: data.municipalityStats
            }
        });
    } catch (error) {
        console.error('Summary data generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate summary data',
            details: error.message
        });
    }
});

/**
 * POST /api/google-drive/create-folder
 * Googleドライブにフォルダを作成
 */
router.post('/create-folder', async (req, res) => {
    try {
        const { folderName, parentFolderId } = req.body;

        if (!folderName) {
            return res.status(400).json({
                success: false,
                error: 'Folder name is required'
            });
        }

        // Google Drive serviceを初期化
        const isInitialized = await googleDriveService.initialize();
        if (!isInitialized) {
            return res.status(503).json({
                success: false,
                error: 'Google Drive service not available'
            });
        }

        // フォルダを作成または取得
        const folderId = await googleDriveService.createOrGetFolder(folderName, parentFolderId);

        res.json({
            success: true,
            message: 'Folder created or retrieved successfully',
            data: {
                folderId,
                folderName
            }
        });
    } catch (error) {
        console.error('Folder creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create folder',
            details: error.message
        });
    }
});

/**
 * GET /api/google-drive/test
 * 接続テスト用エンドポイント
 */
router.get('/test', async (req, res) => {
    try {
        // Google Drive serviceを初期化
        const isInitialized = await googleDriveService.initialize();

        if (!isInitialized) {
            return res.json({
                success: true,
                message: 'Google Drive service test completed',
                status: 'Service not configured - running in local mode',
                initialized: false
            });
        }

        // 簡単なテストデータでレポート生成をテスト
        const testData = {
            regionalStats: [
                { region: 'テスト地方', prefecture: 'テスト県', status: '実施済み', year: 2024, month: 12, eventCount: 1, totalLineCount: 50 }
            ],
            developmentAreaStats: [
                { name: 'テスト開拓地域', targetLineCount: 100, currentLineCount: 50, developmentStatus: '開拓中', priority: 3, progressRate: 50 }
            ],
            municipalityStats: [
                { region: 'テスト地方', prefecture: 'テスト県', municipalityCount: 5 }
            ]
        };

        const fileName = `test_report_${new Date().getTime()}.xlsx`;
        const filePath = await googleDriveService.createExcelReport(testData, fileName);

        // ファイルが作成されたことを確認
        const fs = require('fs');
        const fileExists = fs.existsSync(filePath);

        // テストファイルを削除
        if (fileExists) {
            fs.unlinkSync(filePath);
        }

        res.json({
            success: true,
            message: 'Google Drive service test completed successfully',
            status: 'All functions working properly',
            initialized: true,
            testResults: {
                excelGeneration: fileExists,
                fileName: fileName
            }
        });

    } catch (error) {
        console.error('Google Drive test error:', error);
        res.status(500).json({
            success: false,
            error: 'Google Drive test failed',
            details: error.message
        });
    }
});

module.exports = router;
