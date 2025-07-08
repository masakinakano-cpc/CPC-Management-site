const nodemailer = require('nodemailer');
const mailConfig = require('./config/mail');

async function testEmail() {
    console.log('📧 メール設定を確認中...');
    console.log('Service:', mailConfig.service);
    console.log('User:', mailConfig.user);
    console.log('Pass:', mailConfig.pass ? '設定済み' : '未設定');

    const transporter = nodemailer.createTransport({
        service: mailConfig.service,
        auth: {
            user: mailConfig.user,
            pass: mailConfig.pass
        }
    });

    try {
        console.log('📧 メール送信テスト中...');

        const mailOptions = {
            from: mailConfig.from,
            to: mailConfig.user, // 自分自身に送信
            subject: 'CPC管理システム - メールテスト',
            text: 'これはテストメールです。メール設定が正常に動作しています。',
            html: '<h1>CPC管理システム - メールテスト</h1><p>これはテストメールです。メール設定が正常に動作しています。</p>'
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ メール送信成功!');
        console.log('Message ID:', result.messageId);
        console.log('Response:', result.response);
    } catch (error) {
        console.error('❌ メール送信失敗:');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Full Error:', error);
    }
}

testEmail();
