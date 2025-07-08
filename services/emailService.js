const nodemailer = require('nodemailer');
const { Event, Municipality, User } = require('../models');
const { Op } = require('sequelize');
const mailConfig = require('../config/mail');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.initialize();
    }

    // メール設定の初期化
    initialize() {
        try {
            const config = {
                service: mailConfig.service,
                auth: {
                    user: mailConfig.user,
                    pass: mailConfig.pass
                }
            };

            // 設定が完了している場合のみトランスポーターを作成
            if (config.auth.user && config.auth.pass) {
                this.transporter = nodemailer.createTransport(config);
                this.isConfigured = true;
                console.log('✅ メールサービスが正常に初期化されました');
            } else {
                console.log('⚠️  メール設定が不完全です。config/mail.jsを確認してください。');
                console.log('MAIL_USER: メールアドレス');
                console.log('MAIL_PASS: アプリパスワード');
            }
        } catch (error) {
            console.error('❌ メールサービスの初期化に失敗しました:', error);
        }
    }

    // メール送信
    async sendEmail(to, subject, html, text = null) {
        if (!this.isConfigured || !this.transporter) {
            console.log('⚠️  メールサービスが設定されていません。メール送信をスキップします。');
            return false;
        }

        try {
            const mailOptions = {
                from: mailConfig.from,
                to: to,
                subject: subject,
                html: html,
                text: text || this.htmlToText(html)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ メール送信成功:', result.messageId);
            return true;
        } catch (error) {
            console.error('❌ メール送信失敗:', error);
            return false;
        }
    }

    // HTMLをテキストに変換
    htmlToText(html) {
        return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    // チラシ配布日通知
    async sendFlyerDistributionNotification() {
        try {
            const today = new Date();
            const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

            // 1週間以内にチラシ配布予定のイベントを取得
            const upcomingEvents = await Event.findAll({
                where: {
                    flyerDistributionStartDate: {
                        [Op.between]: [today, oneWeekFromNow]
                    },
                    eventStatus: ['企画中', '準備中']
                },
                include: [
                    {
                        model: Municipality,
                        as: 'Municipality',
                        attributes: ['name', 'prefectureName']
                    }
                ],
                order: [['flyerDistributionStartDate', 'ASC']]
            });

            if (upcomingEvents.length === 0) {
                console.log('📧 チラシ配布予定のイベントはありません');
                return;
            }

            // 管理者ユーザーを取得
            const adminUsers = await User.findAll({
                where: {
                    role: 'admin',
                    isActive: true
                }
            });

            if (adminUsers.length === 0) {
                console.log('⚠️  通知先の管理者ユーザーが見つかりません');
                return;
            }

            // 通知メールを作成
            const subject = `【CPC管理システム】チラシ配布予定通知 (${upcomingEvents.length}件)`;
            const html = this.createFlyerNotificationEmail(upcomingEvents);

            // 各管理者にメール送信
            for (const user of adminUsers) {
                await this.sendEmail(user.email, subject, html);
            }

            console.log(`📧 チラシ配布通知を${adminUsers.length}人の管理者に送信しました`);
        } catch (error) {
            console.error('❌ チラシ配布通知の送信に失敗しました:', error);
        }
    }

    // 期日過ぎ通知
    async sendOverdueNotification() {
        try {
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

            // 先月以前で未完了のイベントを取得
            const overdueEvents = await Event.findAll({
                where: {
                    eventYear: {
                        [Op.lte]: lastMonth.getFullYear()
                    },
                    eventMonth: {
                        [Op.lte]: lastMonth.getMonth() + 1
                    },
                    eventStatus: ['企画中', '準備中']
                },
                include: [
                    {
                        model: Municipality,
                        as: 'Municipality',
                        attributes: ['name', 'prefectureName']
                    }
                ],
                order: [['eventYear', 'ASC'], ['eventMonth', 'ASC']]
            });

            if (overdueEvents.length === 0) {
                console.log('📧 期日過ぎのイベントはありません');
                return;
            }

            // 管理者ユーザーを取得
            const adminUsers = await User.findAll({
                where: {
                    role: 'admin',
                    isActive: true
                }
            });

            if (adminUsers.length === 0) {
                console.log('⚠️  通知先の管理者ユーザーが見つかりません');
                return;
            }

            // 通知メールを作成
            const subject = `【CPC管理システム】期日過ぎイベント通知 (${overdueEvents.length}件)`;
            const html = this.createOverdueNotificationEmail(overdueEvents);

            // 各管理者にメール送信
            for (const user of adminUsers) {
                await this.sendEmail(user.email, subject, html);
            }

            console.log(`📧 期日過ぎ通知を${adminUsers.length}人の管理者に送信しました`);
        } catch (error) {
            console.error('❌ 期日過ぎ通知の送信に失敗しました:', error);
        }
    }

    // 3ヶ月前リマインダー
    async sendThreeMonthReminder() {
        try {
            const today = new Date();
            const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, 1);

            // 3ヶ月後に開催予定のイベントを取得
            const upcomingEvents = await Event.findAll({
                where: {
                    eventYear: threeMonthsFromNow.getFullYear(),
                    eventMonth: threeMonthsFromNow.getMonth() + 1,
                    eventStatus: ['企画中', '準備中']
                },
                include: [
                    {
                        model: Municipality,
                        as: 'Municipality',
                        attributes: ['name', 'prefectureName']
                    }
                ],
                order: [['eventMonth', 'ASC']]
            });

            if (upcomingEvents.length === 0) {
                console.log('📧 3ヶ月前リマインダーの対象イベントはありません');
                return;
            }

            // 管理者ユーザーを取得
            const adminUsers = await User.findAll({
                where: {
                    role: 'admin',
                    isActive: true
                }
            });

            if (adminUsers.length === 0) {
                console.log('⚠️  通知先の管理者ユーザーが見つかりません');
                return;
            }

            // 通知メールを作成
            const subject = `【CPC管理システム】3ヶ月前リマインダー (${upcomingEvents.length}件)`;
            const html = this.createThreeMonthReminderEmail(upcomingEvents);

            // 各管理者にメール送信
            for (const user of adminUsers) {
                await this.sendEmail(user.email, subject, html);
            }

            console.log(`📧 3ヶ月前リマインダーを${adminUsers.length}人の管理者に送信しました`);
        } catch (error) {
            console.error('❌ 3ヶ月前リマインダーの送信に失敗しました:', error);
        }
    }

    // チラシ配布通知メールのHTML作成
    createFlyerNotificationEmail(events) {
        const eventRows = events.map(event => `
            <tr>
                <td>${event.eventYear}年${event.eventMonth}月</td>
                <td>${event.Municipality?.name || '未設定'}</td>
                <td>${event.Municipality?.prefectureName || '未設定'}</td>
                <td>${event.flyerDistributionStartDate ? new Date(event.flyerDistributionStartDate).toLocaleDateString('ja-JP') : '未設定'}</td>
                <td>${event.eventStatus}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>チラシ配布予定通知</h1>
                        <p>1週間以内にチラシ配布が予定されているイベントがあります</p>
                    </div>
                    <div class="content">
                        <p>以下の${events.length}件のイベントで、1週間以内にチラシ配布が予定されています。</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>開催年月</th>
                                    <th>市区町村</th>
                                    <th>都道府県</th>
                                    <th>配布開始日</th>
                                    <th>ステータス</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${eventRows}
                            </tbody>
                        </table>
                        <p>CPC管理システムで詳細を確認してください。</p>
                    </div>
                    <div class="footer">
                        <p>このメールはCPC管理システムから自動送信されています。</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // 期日過ぎ通知メールのHTML作成
    createOverdueNotificationEmail(events) {
        const eventRows = events.map(event => `
            <tr>
                <td>${event.eventYear}年${event.eventMonth}月</td>
                <td>${event.Municipality?.name || '未設定'}</td>
                <td>${event.Municipality?.prefectureName || '未設定'}</td>
                <td>${event.eventStatus}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>期日過ぎイベント通知</h1>
                        <p>開催予定日が過ぎているイベントがあります</p>
                    </div>
                    <div class="content">
                        <p>以下の${events.length}件のイベントで、開催予定日が過ぎています。</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>開催年月</th>
                                    <th>市区町村</th>
                                    <th>都道府県</th>
                                    <th>ステータス</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${eventRows}
                            </tbody>
                        </table>
                        <p>CPC管理システムでステータスを更新してください。</p>
                    </div>
                    <div class="footer">
                        <p>このメールはCPC管理システムから自動送信されています。</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // 3ヶ月前リマインダーメールのHTML作成
    createThreeMonthReminderEmail(events) {
        const eventRows = events.map(event => `
            <tr>
                <td>${event.eventYear}年${event.eventMonth}月</td>
                <td>${event.Municipality?.name || '未設定'}</td>
                <td>${event.Municipality?.prefectureName || '未設定'}</td>
                <td>${event.eventStatus}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #ffc107; color: #212529; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>3ヶ月前リマインダー</h1>
                        <p>3ヶ月後に開催予定のイベントがあります</p>
                    </div>
                    <div class="content">
                        <p>以下の${events.length}件のイベントで、3ヶ月後に開催が予定されています。</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>開催年月</th>
                                    <th>市区町村</th>
                                    <th>都道府県</th>
                                    <th>ステータス</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${eventRows}
                            </tbody>
                        </table>
                        <p>CPC管理システムで準備状況を確認してください。</p>
                    </div>
                    <div class="footer">
                        <p>このメールはCPC管理システムから自動送信されています。</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // カスタム通知メール送信
    async sendCustomNotification(subject, message, recipients = null) {
        try {
            if (!recipients) {
                // 管理者ユーザーを取得
                const adminUsers = await User.findAll({
                    where: {
                        role: 'admin',
                        isActive: true
                    }
                });
                recipients = adminUsers.map(user => user.email);
            }

            if (recipients.length === 0) {
                console.log('⚠️  通知先のユーザーが見つかりません');
                return false;
            }

            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; }
                        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>CPC管理システム通知</h1>
                        </div>
                        <div class="content">
                            <p>${message}</p>
                        </div>
                        <div class="footer">
                            <p>このメールはCPC管理システムから自動送信されています。</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            let successCount = 0;
            for (const email of recipients) {
                const success = await this.sendEmail(email, subject, html);
                if (success) successCount++;
            }

            console.log(`📧 カスタム通知を${successCount}/${recipients.length}人に送信しました`);
            return successCount > 0;
        } catch (error) {
            console.error('❌ カスタム通知の送信に失敗しました:', error);
            return false;
        }
    }
}

module.exports = new EmailService();
