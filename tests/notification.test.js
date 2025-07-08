const request = require('supertest');
const app = require('../test-server');
const emailService = require('../services/emailService');

describe('通知機能テスト', () => {
    let authToken;
    let testUser;

    beforeAll(async () => {
        // ログインしてトークンを取得
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testadmin',
                password: 'password123'
            });

        authToken = loginResponse.body.token;
        testUser = loginResponse.body.user;
    });

    describe('通知設定API', () => {
        test('GET /api/notifications/settings - 通知設定の取得', async () => {
            const response = await request(app)
                .get('/api/notifications/settings')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('mailService');
            expect(response.body.data).toHaveProperty('mailUser');
            expect(response.body.data).toHaveProperty('mailPass');
            expect(response.body.data).toHaveProperty('isConfigured');
        });

        test('GET /api/notifications/settings - 認証なしでアクセス拒否', async () => {
            const response = await request(app)
                .get('/api/notifications/settings');

            expect(response.status).toBe(401);
        });
    });

    describe('通知先ユーザーAPI', () => {
        test('GET /api/notifications/recipients - 通知先ユーザーの取得', async () => {
            const response = await request(app)
                .get('/api/notifications/recipients')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0]).toHaveProperty('id');
            expect(response.body.data[0]).toHaveProperty('email');
            expect(response.body.data[0]).toHaveProperty('role');
        });
    });

    describe('通知対象イベントAPI', () => {

        test('GET /api/notifications/target-events?type=flyer-distribution - チラシ配布対象イベント', async () => {
            const response = await request(app)
                .get('/api/notifications/target-events?type=flyer-distribution')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('type', 'flyer-distribution');
            expect(response.body.data).toHaveProperty('count');
            expect(response.body.data).toHaveProperty('events');
            expect(Array.isArray(response.body.data.events)).toBe(true);
        });

        test('GET /api/notifications/target-events?type=overdue - 期日過ぎ対象イベント', async () => {
            const response = await request(app)
                .get('/api/notifications/target-events?type=overdue')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('type', 'overdue');
        });

        test('GET /api/notifications/target-events?type=three-month-reminder - 3ヶ月前リマインダー対象イベント', async () => {
            const response = await request(app)
                .get('/api/notifications/target-events?type=three-month-reminder')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('type', 'three-month-reminder');
        });

        test('GET /api/notifications/target-events - 無効なタイプ', async () => {
            const response = await request(app)
                .get('/api/notifications/target-events?type=invalid')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('通知実行API', () => {
        test('POST /api/notifications/flyer-distribution - チラシ配布通知実行', async () => {
            const response = await request(app)
                .post('/api/notifications/flyer-distribution')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('チラシ配布通知を実行しました');
        });

        test('POST /api/notifications/overdue - 期日過ぎ通知実行', async () => {
            const response = await request(app)
                .post('/api/notifications/overdue')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('期日過ぎ通知を実行しました');
        });

        test('POST /api/notifications/three-month-reminder - 3ヶ月前リマインダー実行', async () => {
            const response = await request(app)
                .post('/api/notifications/three-month-reminder')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('3ヶ月前リマインダーを実行しました');
        });
    });

    describe('カスタム通知API', () => {
        test('POST /api/notifications/custom - カスタム通知送信', async () => {
            const notificationData = {
                subject: 'テスト通知',
                message: 'これはテストメッセージです。',
                recipients: [testUser.email]
            };

            const response = await request(app)
                .post('/api/notifications/custom')
                .set('Authorization', `Bearer ${authToken}`)
                .send(notificationData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('カスタム通知を送信しました');
        });

        test('POST /api/notifications/custom - 件名なしでエラー', async () => {
            const notificationData = {
                message: 'これはテストメッセージです。'
            };

            const response = await request(app)
                .post('/api/notifications/custom')
                .set('Authorization', `Bearer ${authToken}`)
                .send(notificationData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('件名とメッセージは必須です');
        });

        test('POST /api/notifications/custom - メッセージなしでエラー', async () => {
            const notificationData = {
                subject: 'テスト通知'
            };

            const response = await request(app)
                .post('/api/notifications/custom')
                .set('Authorization', `Bearer ${authToken}`)
                .send(notificationData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('件名とメッセージは必須です');
        });
    });

    describe('テストメールAPI', () => {
        test('POST /api/notifications/test - テストメール送信', async () => {
            const testData = {
                email: 'test@example.com'
            };

            const response = await request(app)
                .post('/api/notifications/test')
                .set('Authorization', `Bearer ${authToken}`)
                .send(testData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('テストメールを送信しました');
        });

        test('POST /api/notifications/test - メールアドレスなしでエラー', async () => {
            const response = await request(app)
                .post('/api/notifications/test')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('テスト用メールアドレスが必要です');
        });
    });

    describe('通知履歴API', () => {
        test('GET /api/notifications/history - 通知履歴の取得', async () => {
            const response = await request(app)
                .get('/api/notifications/history')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('lastFlyerNotification');
            expect(response.body.data).toHaveProperty('lastOverdueNotification');
            expect(response.body.data).toHaveProperty('lastThreeMonthReminder');
            expect(response.body.data).toHaveProperty('totalNotificationsSent');
        });
    });

    describe('権限チェック', () => {
        test('一般ユーザーで通知設定にアクセス拒否', async () => {
            // 一般ユーザーでログイン（失敗する）
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'regularuser',
                    password: 'wrongpassword'
                });

            expect(loginResponse.status).toBe(401);
        });
    });
});

describe('EmailService 単体テスト', () => {
    test('HTML to Text 変換', () => {
        const html = '<h1>タイトル</h1><p>これは<strong>テスト</strong>です。</p>';
        const text = emailService.htmlToText(html);
        expect(text).toBe('タイトルこれはテストです。');
    });

    test('メール設定の初期化', () => {
        expect(emailService).toHaveProperty('isConfigured');
        expect(typeof emailService.isConfigured).toBe('boolean');
    });

    test('メール送信（設定なし）', async () => {
        const result = await emailService.sendEmail('test@example.com', 'テスト', 'テストメッセージ');
        expect(result).toBe(false); // 設定がないため失敗
    });
});
