const { Event, Municipality, DevelopmentArea } = require('../models');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');

class NotificationService {
    constructor() {
        this.initializeEmailTransporter();
    }

    // メール設定の初期化
    initializeEmailTransporter() {
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // チラシ配布日通知チェック
    async checkUpcomingFlyerDistribution() {
        try {
            console.log('🔔 チラシ配布日通知チェック開始');

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            // 明日と来週チラシ配布予定のイベントを取得
            const upcomingEvents = await Event.findAll({
                where: {
                    flyerDistributionStartDate: {
                        [Op.between]: [tomorrow, nextWeek]
                    },
                    eventStatus: {
                        [Op.in]: ['企画中', '準備中']
                    }
                },
                include: [
                    {
                        model: Municipality,
                        as: 'municipality',
                        attributes: ['name', 'prefectureName']
                    },
                    {
                        model: DevelopmentArea,
                        as: 'developmentArea',
                        attributes: ['name']
                    }
                ]
            });

            console.log(`📋 チラシ配布予定イベント数: ${upcomingEvents.length}`);

            for (const event of upcomingEvents) {
                await this.sendFlyerDistributionNotification(event);
            }

            // 期日過ぎのイベントもチェック
            await this.checkOverdueEvents();

            console.log('✅ チラシ配布日通知チェック完了');
            return upcomingEvents;
        } catch (error) {
            console.error('❌ チラシ配布日通知チェック失敗:', error);
            throw error;
        }
    }

    // 期日過ぎのイベントチェック
    async checkOverdueEvents() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const overdueEvents = await Event.findAll({
                where: {
                    flyerDistributionStartDate: {
                        [Op.lt]: today
                    },
                    eventStatus: {
                        [Op.in]: ['企画中', '準備中']
                    }
                },
                include: [
                    {
                        model: Municipality,
                        as: 'municipality',
                        attributes: ['name', 'prefectureName']
                    }
                ]
            });

            console.log(`⚠️  期日過ぎイベント数: ${overdueEvents.length}`);

            for (const event of overdueEvents) {
                await this.sendOverdueNotification(event);
            }

            return overdueEvents;
        } catch (error) {
            console.error('❌ 期日過ぎイベントチェック失敗:', error);
            throw error;
        }
    }

    // 3ヶ月前リマインド通知
    async checkThreeMonthReminders() {
        try {
            console.log('🔔 3ヶ月前リマインド通知チェック開始');

            const threeMonthsFromNow = new Date();
            threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

            const targetMonth = threeMonthsFromNow.getMonth() + 1;
            const targetYear = threeMonthsFromNow.getFullYear();

            const upcomingEvents = await Event.findAll({
                where: {
                    eventYear: targetYear,
                    eventMonth: targetMonth,
                    eventStatus: {
                        [Op.in]: ['企画中', '準備中']
                    }
                },
                include: [
                    {
                        model: Municipality,
                        as: 'municipality',
                        attributes: ['name', 'prefectureName']
                    },
                    {
                        model: DevelopmentArea,
                        as: 'developmentArea',
                        attributes: ['name']
                    }
                ]
            });

            console.log(`📋 3ヶ月前リマインド対象イベント数: ${upcomingEvents.length}`);

            for (const event of upcomingEvents) {
                await this.sendThreeMonthReminderNotification(event);
            }

            console.log('✅ 3ヶ月前リマインド通知チェック完了');
            return upcomingEvents;
        } catch (error) {
            console.error('❌ 3ヶ月前リマインド通知チェック失敗:', error);
            throw error;
        }
    }

    // チラシ配布日通知メール送信
    async sendFlyerDistributionNotification(event) {
        try {
            const subject = `[CPC管理] チラシ配布日通知 - ${event.municipality?.name}`;
            const daysUntil = Math.ceil((new Date(event.flyerDistributionStartDate) - new Date()) / (1000 * 60 * 60 * 24));

            const htmlContent = `
                <h2>チラシ配布日通知</h2>
                <p>以下のイベントのチラシ配布日が近づいています。</p>

                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>${event.municipality?.name} (${event.municipality?.prefectureName})</h3>
                    <p><strong>開催予定:</strong> ${event.eventYear}年${event.eventMonth}月</p>
                    <p><strong>ライン数:</strong> ${event.lineCount}</p>
                    <p><strong>会場:</strong> ${event.venue}</p>
                    <p><strong>チラシ配布日:</strong> ${new Date(event.flyerDistributionStartDate).toLocaleDateString('ja-JP')} (${daysUntil}日後)</p>
                    <p><strong>現在のステータス:</strong> ${event.eventStatus}</p>
                </div>

                <p>準備が完了していない場合は、早急に対応をお願いします。</p>
                <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${event.id}">詳細を確認</a></p>
            `;

            await this.sendEmail(subject, htmlContent);

            console.log(`📧 チラシ配布日通知送信: ${event.municipality?.name}`);
        } catch (error) {
            console.error('❌ チラシ配布日通知送信失敗:', error);
        }
    }

    // 期日過ぎ通知メール送信
    async sendOverdueNotification(event) {
        try {
            const subject = `[CPC管理] 期日過ぎ通知 - ${event.municipality?.name}`;
            const daysOverdue = Math.ceil((new Date() - new Date(event.flyerDistributionStartDate)) / (1000 * 60 * 60 * 24));

            const htmlContent = `
                <h2 style="color: #e74c3c;">期日過ぎ通知</h2>
                <p>以下のイベントのチラシ配布日が過ぎています。</p>

                <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c;">
                    <h3>${event.municipality?.name} (${event.municipality?.prefectureName})</h3>
                    <p><strong>開催予定:</strong> ${event.eventYear}年${event.eventMonth}月</p>
                    <p><strong>ライン数:</strong> ${event.lineCount}</p>
                    <p><strong>会場:</strong> ${event.venue}</p>
                    <p><strong>チラシ配布日:</strong> ${new Date(event.flyerDistributionStartDate).toLocaleDateString('ja-JP')} (${daysOverdue}日前)</p>
                    <p><strong>現在のステータス:</strong> ${event.eventStatus}</p>
                </div>

                <p><strong>緊急対応が必要です。</strong>ステータスの確認と適切な対応をお願いします。</p>
                <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${event.id}">詳細を確認</a></p>
            `;

            await this.sendEmail(subject, htmlContent);

            console.log(`📧 期日過ぎ通知送信: ${event.municipality?.name}`);
        } catch (error) {
            console.error('❌ 期日過ぎ通知送信失敗:', error);
        }
    }

    // 3ヶ月前リマインド通知メール送信
    async sendThreeMonthReminderNotification(event) {
        try {
            const subject = `[CPC管理] 3ヶ月前リマインド - ${event.municipality?.name}`;

            const htmlContent = `
                <h2>3ヶ月前リマインド</h2>
                <p>以下のイベントの開催まで3ヶ月となりました。</p>

                <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3182ce;">
                    <h3>${event.municipality?.name} (${event.municipality?.prefectureName})</h3>
                    <p><strong>開催予定:</strong> ${event.eventYear}年${event.eventMonth}月</p>
                    <p><strong>ライン数:</strong> ${event.lineCount}</p>
                    <p><strong>会場:</strong> ${event.venue}</p>
                    <p><strong>現在のステータス:</strong> ${event.eventStatus}</p>
                </div>

                <p>準備の確認と、必要に応じて次のステップへの移行をお願いします。</p>
                <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${event.id}">詳細を確認</a></p>
            `;

            await this.sendEmail(subject, htmlContent);

            console.log(`📧 3ヶ月前リマインド送信: ${event.municipality?.name}`);
        } catch (error) {
            console.error('❌ 3ヶ月前リマインド送信失敗:', error);
        }
    }

    // ステータス変更通知
    async sendStatusChangeNotification(event, oldStatus, newStatus) {
        try {
            const subject = `[CPC管理] ステータス変更通知 - ${event.municipality?.name}`;

            const htmlContent = `
                <h2>ステータス変更通知</h2>
                <p>以下のイベントのステータスが変更されました。</p>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>${event.municipality?.name} (${event.municipality?.prefectureName})</h3>
                    <p><strong>開催予定:</strong> ${event.eventYear}年${event.eventMonth}月</p>
                    <p><strong>ライン数:</strong> ${event.lineCount}</p>
                    <p><strong>会場:</strong> ${event.venue}</p>
                    <p><strong>変更前:</strong> <span style="color: #dc3545;">${oldStatus}</span></p>
                    <p><strong>変更後:</strong> <span style="color: #28a745;">${newStatus}</span></p>
                    <p><strong>変更日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
                </div>

                <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${event.id}">詳細を確認</a></p>
            `;

            await this.sendEmail(subject, htmlContent);

            console.log(`📧 ステータス変更通知送信: ${event.municipality?.name} (${oldStatus} → ${newStatus})`);
        } catch (error) {
            console.error('❌ ステータス変更通知送信失敗:', error);
        }
    }

    // メール送信
    async sendEmail(subject, htmlContent) {
        try {
            const recipients = process.env.NOTIFICATION_RECIPIENTS?.split(',') || ['admin@example.com'];

            // 実際のメール送信はSMTP設定が必要
            if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.log('📧 メール送信（模擬）:', subject);
                console.log('📧 送信先:', recipients);
                console.log('📧 内容:', htmlContent.replace(/<[^>]*>/g, '').substring(0, 100) + '...');
                return;
            }

            const mailOptions = {
                from: process.env.SMTP_USER,
                to: recipients.join(','),
                subject: subject,
                html: htmlContent
            };

            await this.transporter.sendMail(mailOptions);
            console.log('📧 メール送信成功:', subject);
        } catch (error) {
            console.error('❌ メール送信失敗:', error);
        }
    }

    // 通知履歴の記録
    async logNotification(type, eventId, message) {
        try {
            // 通知履歴をデータベースに保存する場合
            console.log(`📝 通知履歴: ${type} - Event ID: ${eventId} - ${message}`);

            // 必要に応じてNotificationHistoryテーブルを作成して保存
            // await NotificationHistory.create({
            //     type,
            //     eventId,
            //     message,
            //     sentAt: new Date()
            // });
        } catch (error) {
            console.error('❌ 通知履歴記録失敗:', error);
        }
    }

    // 通知設定の取得
    async getNotificationSettings() {
        return {
            flyerDistributionDays: parseInt(process.env.FLYER_NOTIFICATION_DAYS || '7'),
            reminderMonths: parseInt(process.env.REMINDER_MONTHS || '3'),
            recipients: process.env.NOTIFICATION_RECIPIENTS?.split(',') || ['admin@example.com'],
            enableEmail: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
            enableSms: process.env.ENABLE_SMS_NOTIFICATIONS === 'true'
        };
    }
}

module.exports = new NotificationService();
