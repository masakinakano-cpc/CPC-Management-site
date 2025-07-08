# CPC管理サイト

CPC（Community Partnership Center）の開催予定とデータを管理するWebアプリケーションです。AppSheetの代替として開発され、より柔軟で高機能な管理システムを提供します。

## 🌟 主な機能

### 📅 イベント管理
- **開催予定管理**: 年月、開催地、ライン数、ステータス管理
- **複数ビュー表示**: テーブル、カード、カレンダー、ダッシュボード表示
- **ステータス自動更新**: 該当月に実施中、月終了時に実施済みへ自動変更
- **継続開催管理**: 実施済みから次年度候補自動生成、3ヶ月前リマインド

### 🗺️ 地域データ管理
- **市区町村マスタ**: 88市区町村（関東、関西、中部、九州、東北地方）
- **開拓地域管理**: 目標・現在ライン数、進捗率、優先度管理
- **地域別統計**: 自動集計とレポート生成

### 📊 可視化・分析
- **ダッシュボード**: イベント数、地域別統計、ステータス分布
- **グラフ表示**: Chart.js による視覚的データ表示
- **月次レポート**: PDF・Excel形式でのレポート自動生成

### 🔄 自動化機能
- **メール通知システム**: チラシ配布日通知、期日過ぎ通知、3ヶ月前リマインダー
- **Googleドライブ連携**: 地域別集計データの自動アップロード
- **cronジョブ**: 月次レポート自動生成、ステータス自動更新

### 📱 UI/UX
- **レスポンシブデザイン**: PC・タブレット・スマートフォン対応
- **ダークモード**: 視認性向上のためのテーマ切り替え
- **検索・フィルタリング**: 高速検索と詳細フィルタリング機能

## 🛠️ 技術スタック

### バックエンド
- **Node.js** + **Express.js**: サーバーサイド
- **Sequelize ORM**: データベース操作
- **SQLite**: データベース（開発・本番）
- **cron**: スケジュールタスク

### フロントエンド
- **React**: ユーザーインターフェース
- **Chart.js**: グラフ・可視化
- **CSS3**: スタイリング（レスポンシブ・ダークモード）

### 外部連携
- **Google Drive API**: ファイル管理・共有
- **ExcelJS**: Excelレポート生成
- **Nodemailer**: メール通知システム

## 📋 システム要件

- **Node.js**: v16.0.0 以上
- **npm**: v8.0.0 以上
- **OS**: Windows、macOS、Linux対応

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/masakinakano-cpc/CPC-Management-site.git
cd CPC-Management-site
```

### 2. 依存関係のインストール

```bash
# サーバーサイド依存関係
npm install

# フロントエンド依存関係
cd client
npm install
cd ..
```

### 3. 環境設定

`.env`ファイルを作成し、必要な環境変数を設定：

```env
# サーバーポート
PORT=5000

# データベース設定
DB_PATH=./database.sqlite

# メール設定（通知機能用）
MAIL_SERVICE=gmail
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Googleドライブ連携（オプション）
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/google-service-account.json
```

### 4. データベース初期化

```bash
# サンプルデータ投入
npm run seed

# 地域データ拡張（関西・中部地方）
npm run expand-regions
```

### 5. アプリケーション起動

#### 開発環境
```bash
# フロントエンドとバックエンドを同時起動
npm run dev:full

# または個別起動
npm run server  # バックエンド（ポート5000）
npm run client  # フロントエンド（ポート3000）
```

#### 本番環境
```bash
# フロントエンドビルド
npm run build

# サーバー起動
npm start
```

## 🔧 オプション設定

### Googleドライブ連携設定

1. Google Cloud Consoleでプロジェクト作成
2. Google Drive APIとGoogle Sheets APIを有効化
3. サービスアカウント作成・キーファイルダウンロード
4. `config/google-service-account.json`として保存
5. サービスアカウントに対象フォルダの編集権限付与

### メール通知設定

Gmail使用の場合：
1. Googleアカウントの2段階認証を有効化
2. アプリパスワードを生成
3. `.env`ファイルに設定

**通知機能の種類：**
- **チラシ配布通知**: 1週間以内にチラシ配布予定のイベントを管理者に通知
- **期日過ぎ通知**: 開催予定日が過ぎているイベントを管理者に通知
- **3ヶ月前リマインダー**: 3ヶ月後に開催予定のイベントを管理者に通知
- **カスタム通知**: 管理者が任意のメッセージを指定ユーザーに送信

## 📖 使用方法

### 基本操作

1. **ダッシュボード**: `http://localhost:3000/` - 全体概要の確認
2. **イベント管理**: `/events` - 開催予定の追加・編集・削除
3. **マルチビュー**: `/multi-view` - 異なる形式でのデータ表示
4. **カレンダー**: `/calendar` - カレンダー形式での予定確認
5. **マスタ管理**: `/masters` - 各種マスタデータの管理
6. **通知管理**: `/notifications` - メール通知の設定と管理

### API エンドポイント

#### イベント管理
- `GET /api/events` - イベント一覧取得
- `POST /api/events` - イベント作成
- `PUT /api/events/:id` - イベント更新
- `DELETE /api/events/:id` - イベント削除

#### 統計・ダッシュボード
- `GET /api/dashboard/stats` - ダッシュボード統計
- `GET /api/dashboard/monthly-events` - 月次イベント統計
- `GET /api/dashboard/regional-distribution` - 地域別分布

#### Googleドライブ
- `GET /api/google-drive/status` - 連携状態確認
- `POST /api/google-drive/generate-report` - 手動レポート生成
- `GET /api/google-drive/summary-data` - 集計データ取得

#### 通知管理
- `GET /api/notifications/settings` - 通知設定取得
- `POST /api/notifications/flyer-distribution` - チラシ配布通知実行
- `POST /api/notifications/overdue` - 期日過ぎ通知実行
- `POST /api/notifications/three-month-reminder` - 3ヶ月前リマインダー実行
- `POST /api/notifications/custom` - カスタム通知送信
- `POST /api/notifications/test` - テストメール送信

### データ管理

#### CSVエクスポート
マルチビューページから各種データをCSV形式でエクスポート可能

#### 月次レポート
- 自動生成: 毎月1日午前2時に自動実行
- 手動生成: APIまたは管理画面から実行可能

## 🔄 自動化機能

### cronジョブスケジュール

```javascript
// ステータス自動更新（毎日午前1時）
'0 1 * * *' => イベントステータス自動更新

// チラシ配布日通知（毎日午前8時）
'0 8 * * *' => チラシ配布日通知チェック

// 期日過ぎ通知（毎日午前9時）
'0 9 * * *' => 期日過ぎイベント通知

// 3ヶ月前リマインダー（毎日午前10時）
'0 10 * * *' => 継続開催3ヶ月前通知

// 月次レポート（毎月1日午前0時）
'0 0 1 * *' => 月次レポート生成

// Googleドライブレポート（毎月1日午前2時）
'0 2 1 * *' => Googleドライブ月次レポート
```

## 🧪 テスト

```bash
# アプリケーション動作確認
npm run test

# Googleドライブ機能テスト
node test-google-drive.js
```

## 📁 プロジェクト構造

```
CPC-Management-site/
├── client/                 # Reactフロントエンド
│   ├── public/
│   ├── src/
│   │   ├── components/     # UIコンポーネント
│   │   ├── services/       # API呼び出し
│   │   └── styles/         # CSSファイル
│   └── package.json
├── config/                 # 設定ファイル
├── models/                 # Sequelizeモデル
├── routes/                 # APIルート
├── services/               # ビジネスロジック
├── scripts/                # データベーススクリプト
├── server.js               # メインサーバーファイル
├── package.json
└── README.md
```

## 🌍 デプロイ

### Heroku デプロイ

1. Herokuアプリ作成
```bash
heroku create your-app-name
```

2. 環境変数設定
```bash
heroku config:set NODE_ENV=production
heroku config:set MAIL_USER=your-email@gmail.com
heroku config:set MAIL_PASS=your-app-password
```

3. デプロイ
```bash
git push heroku main
```

### VPS デプロイ

1. Node.js環境構築
2. プロジェクトクローン・依存関係インストール
3. PM2などでプロセス管理
4. Nginx リバースプロキシ設定

## 🔒 セキュリティ

- **Rate Limiting**: API呼び出し制限
- **Helmet**: セキュリティヘッダー設定
- **データバリデーション**: Joi使用
- **環境変数**: 機密情報の分離

## 📊 監視・ログ

- **Morgan**: HTTPリクエストログ
- **Console Logging**: アプリケーションログ
- **エラーハンドリング**: 包括的エラー処理

## 🤝 貢献

1. フォーク
2. フィーチャーブランチ作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエスト作成

## 📄 ライセンス

ISC License

## 📞 サポート

問題や質問がある場合：

1. **Issues**: GitHubのIssueページで報告
2. **Documentation**: このREADMEファイルを参照
3. **Email**: 開発チームへ直接連絡

## 🔄 更新履歴

### v1.0.0 (2024-12)
- 初期リリース
- 基本的なイベント管理機能
- ダッシュボード・可視化機能
- 自動化機能（ステータス更新・通知）
- Googleドライブ連携
- 地域データ拡張（88市区町村）

---

**開発チーム**: CPC管理システム開発チーム
**更新日**: 2024年12月
