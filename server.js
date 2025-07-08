const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

// データベース設定
const { connectDatabase } = require('./models');

// ルーターのインポート
const eventRoutes = require('./routes/events');
const municipalityRoutes = require('./routes/municipalities');
const developmentAreaRoutes = require('./routes/developmentAreas');
const venueHistoryRoutes = require('./routes/venueHistories');
const schoolRoutes = require('./routes/schools');
const dashboardRoutes = require('./routes/dashboard');
const googleDriveRoutes = require('./routes/googleDrive');

// アプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 5000;

// セキュリティミドルウェア
app.use(helmet());

// レート制限
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 最大100リクエスト
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// CORS設定
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || 'https://your-frontend-domain.com'
        : 'http://localhost:3000',
    credentials: true
}));

// ログ設定
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ボディパーサー
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静的ファイルの配信
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/events', eventRoutes);
app.use('/api/municipalities', municipalityRoutes);
app.use('/api/development-areas', developmentAreaRoutes);
app.use('/api/venue-histories', venueHistoryRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/google-drive', googleDriveRoutes);

// ヘルスチェック
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 本番環境でのReactアプリ配信
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client/build/index.html'));
    });
}

// エラーハンドリング
app.use((err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.errors
        });
    }

    if (err.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: 'Database Validation Error',
            details: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong!'
            : err.message
    });
});

// 404ハンドリング
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found.'
    });
});

// 自動化タスク（ステータス自動更新） - 毎日午前6時に実行
cron.schedule('0 6 * * *', async () => {
    try {
        console.log('Daily status update started...');
        const statusUpdateService = require('./services/statusUpdateService');
        await statusUpdateService.updateAllEventStatuses();
        console.log('Daily status update completed.');
    } catch (error) {
        console.error('Error in daily status update:', error);
    }
});

// 自動化タスク（次年度候補生成と3ヶ月前リマインド） - 毎日午前1時に実行
cron.schedule('0 1 * * *', async () => {
    try {
        console.log('Monthly reminder and candidate generation started...');
        const statusUpdateService = require('./services/statusUpdateService');
        const notificationService = require('./services/notificationService');
        await statusUpdateService.generateNextYearCandidates();
        await notificationService.checkThreeMonthReminders();
        console.log('Monthly reminder and candidate generation completed.');
    } catch (error) {
        console.error('Error in monthly reminder and candidate generation:', error);
    }
});

// 自動化タスク（チラシ配布日通知）
cron.schedule('0 9 * * *', async () => {
    try {
        console.log('Daily notification check started...');
        const notificationService = require('./services/notificationService');
        await notificationService.checkUpcomingFlyerDistribution();
        console.log('Daily notification check completed.');
    } catch (error) {
        console.error('Error in daily notification check:', error);
    }
});

// 自動化タスク（月次レポート）
cron.schedule('0 0 1 * *', async () => {
    try {
        console.log('Monthly report generation started...');
        const reportService = require('./services/reportService');
        await reportService.generateMonthlyReport();
        console.log('Monthly report generation completed.');
    } catch (error) {
        console.error('Error in monthly report generation:', error);
    }
});

// 自動化タスク（Googleドライブ月次レポート） - 毎月1日午前2時に実行
cron.schedule('0 2 1 * *', async () => {
    try {
        console.log('Google Drive monthly report generation started...');
        const googleDriveService = require('./services/googleDriveService');
        await googleDriveService.initialize();
        await googleDriveService.generateMonthlyReport();
        console.log('Google Drive monthly report generation completed.');
    } catch (error) {
        console.error('Error in Google Drive monthly report generation:', error);
    }
});

// サーバー起動
const startServer = async () => {
    try {
        // データベース接続
        await connectDatabase();

        // サーバー起動
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`🌐 Frontend URL: http://localhost:3000`);
            }
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// プロセス終了時の処理
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    try {
        const { sequelize } = require('./models');
        await sequelize.close();
        console.log('✅ Database connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// 未処理の例外をキャッチ
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// サーバー起動
startServer();

module.exports = app;
