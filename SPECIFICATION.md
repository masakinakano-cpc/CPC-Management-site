# CPC管理サイト システム仕様書

## 📋 目次
1. [システム概要](#システム概要)
2. [アーキテクチャ](#アーキテクチャ)
3. [データベース設計](#データベース設計)
4. [API仕様](#api仕様)
5. [フロントエンド仕様](#フロントエンド仕様)
6. [機能仕様](#機能仕様)
7. [自動化機能](#自動化機能)
8. [セキュリティ仕様](#セキュリティ仕様)
9. [運用仕様](#運用仕様)
10. [技術仕様](#技術仕様)

---

## 🎯 システム概要

### プロジェクト名
**CPC管理サイト** (Community Partnership Center Management System)

### 目的
AppSheetの代替として、より柔軟で高機能なCPC開催予定管理システムを提供する。

### 主要機能
- イベント管理（開催予定・実施状況・結果管理）
- 地域データ管理（88市区町村対応）
- ダッシュボード・可視化
- 自動化機能（ステータス更新・通知）
- Googleドライブ連携
- レポート生成

---

## 🏗️ アーキテクチャ

### システム構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   フロントエンド   │    │    バックエンド    │    │    データベース    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (SQLite)      │
│   Port: 3000    │    │   Port: 3001    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Google Drive  │    │   メール通知     │    │   外部API       │
│   API           │    │   (Nodemailer)  │    │   (Chart.js)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技術スタック
- **フロントエンド**: React 18.x, Chart.js, CSS3
- **バックエンド**: Node.js 16+, Express.js 4.x
- **データベース**: SQLite 3.x, Sequelize ORM
- **認証**: JWT (JSON Web Token)
- **スケジューリング**: node-cron
- **外部連携**: Google Drive API, Nodemailer

---

## 🗄️ データベース設計

### テーブル構成

#### 1. events（イベント管理）
| カラム名 | 型 | 制約 | 説明 |
|---------|----|------|------|
| id | UUID | PK | 開催ID（自動生成） |
| eventYear | INTEGER | NOT NULL | 開催年（2020-2050） |
| eventMonth | INTEGER | NOT NULL | 開催月（1-12） |
| lineCount | INTEGER | NOT NULL | ライン数 |
| flyerDistributionStartDate | DATETIME | NULL | チラシ配布開始日 |
| remarks | TEXT | NULL | 備考 |
| eventStatus | ENUM | NOT NULL | 開催ステータス |
| municipalityId | UUID | FK | 開催地（市区町村）ID |
| developmentAreaId | UUID | FK | 開拓地域ID |
| venueHistoryId | UUID | FK | 実施リストID |
| schoolId | UUID | FK | 小学校ID |

**ステータス種類**:
- 構想
- 実施予定
- 準備着手中
- 実施中
- 実施済み
- 中止

#### 2. municipalities（市区町村マスタ）
| カラム名 | 型 | 制約 | 説明 |
|---------|----|------|------|
| id | UUID | PK | 市区町村ID |
| name | VARCHAR(255) | UNIQUE | 市区町村名 |
| prefectureName | VARCHAR(255) | NOT NULL | 都道府県名 |
| region | VARCHAR(255) | NULL | 地域（関東・関西等） |
| populationCategory | TEXT | NULL | 人口カテゴリ |
| isActive | BOOLEAN | DEFAULT true | 有効フラグ |
| priority | INTEGER | DEFAULT 0 | 優先度 |

#### 3. development_areas（開拓地域管理）
| カラム名 | 型 | 制約 | 説明 |
|---------|----|------|------|
| id | UUID | PK | 開拓地域ID |
| name | VARCHAR(255) | UNIQUE | 地域名 |
| code | VARCHAR(255) | UNIQUE | 地域コード |
| description | TEXT | NULL | 説明 |
| targetLineCount | INTEGER | NULL | 目標ライン数 |
| currentLineCount | INTEGER | DEFAULT 0 | 現在ライン数 |
| managerName | VARCHAR(255) | NULL | 担当者名 |
| contactInfo | TEXT | NULL | 連絡先 |
| developmentStatus | TEXT | DEFAULT '未着手' | 開発状況 |
| priority | INTEGER | DEFAULT 0 | 優先度 |

#### 4. venue_histories（実施リスト管理）
| カラム名 | 型 | 制約 | 説明 |
|---------|----|------|------|
| id | UUID | PK | 実施リストID |
| venueName | VARCHAR(255) | NOT NULL | 会場名 |
| venueCode | VARCHAR(255) | UNIQUE | 会場コード |
| address | TEXT | NULL | 住所 |
| capacity | INTEGER | NULL | 収容人数 |
| venueType | TEXT | NULL | 会場タイプ |
| implementationDate | DATETIME | NULL | 実施日 |
| participantCount | INTEGER | NULL | 参加者数 |
| linesUsed | INTEGER | NULL | 使用ライン数 |
| eventResult | TEXT | NULL | 実施結果 |
| satisfaction | INTEGER | NULL | 満足度 |
| isRecommended | BOOLEAN | DEFAULT false | 推奨フラグ |

#### 5. schools（小学校管理）
| カラム名 | 型 | 制約 | 説明 |
|---------|----|------|------|
| id | UUID | PK | 小学校ID |
| schoolName | VARCHAR(255) | NOT NULL | 学校名 |
| schoolCode | VARCHAR(255) | UNIQUE | 学校コード |
| prefectureName | VARCHAR(255) | NOT NULL | 都道府県名 |
| cityName | VARCHAR(255) | NOT NULL | 市区町村名 |
| address | TEXT | NULL | 住所 |
| studentCount | INTEGER | NULL | 児童数 |
| classCount | INTEGER | NULL | クラス数 |
| schoolType | TEXT | NULL | 学校種別 |
| hasGym | BOOLEAN | DEFAULT false | 体育館有無 |
| hasAuditorium | BOOLEAN | DEFAULT false | 講堂有無 |
| isTargetSchool | BOOLEAN | DEFAULT false | 対象校フラグ |

#### 6. users（ユーザー管理）
| カラム名 | 型 | 制約 | 説明 |
|---------|----|------|------|
| id | INTEGER | PK, AUTO | ユーザーID |
| username | VARCHAR(50) | UNIQUE | ユーザー名 |
| email | VARCHAR(100) | UNIQUE | メールアドレス |
| password | VARCHAR(255) | NOT NULL | ハッシュ化パスワード |
| role | TEXT | DEFAULT 'user' | ロール |
| firstName | VARCHAR(50) | NOT NULL | 名 |
| lastName | VARCHAR(50) | NOT NULL | 姓 |
| isActive | BOOLEAN | DEFAULT true | 有効フラグ |

---

## 🔌 API仕様

### 認証API
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/register
GET  /api/auth/me
POST /api/auth/refresh
```

### イベント管理API
```
GET    /api/events              # イベント一覧取得
POST   /api/events              # イベント作成
GET    /api/events/:id          # イベント詳細取得
PUT    /api/events/:id          # イベント更新
DELETE /api/events/:id          # イベント削除
GET    /api/events/status/:status # ステータス別イベント取得
```

### マスタ管理API
```
# 市区町村
GET    /api/municipalities
POST   /api/municipalities
PUT    /api/municipalities/:id
DELETE /api/municipalities/:id

# 開拓地域
GET    /api/development-areas
POST   /api/development-areas
PUT    /api/development-areas/:id
DELETE /api/development-areas/:id

# 実施リスト
GET    /api/venue-histories
POST   /api/venue-histories
PUT    /api/venue-histories/:id
DELETE /api/venue-histories/:id

# 小学校
GET    /api/schools
POST   /api/schools
PUT    /api/schools/:id
DELETE /api/schools/:id
```

### ダッシュボードAPI
```
GET /api/dashboard/stats                    # 基本統計
GET /api/dashboard/monthly-events           # 月次イベント統計
GET /api/dashboard/regional-distribution    # 地域別分布
GET /api/dashboard/status-distribution      # ステータス別分布
```

### 通知管理API
```
GET  /api/notifications/settings            # 通知設定取得
POST /api/notifications/flyer-distribution  # チラシ配布通知
POST /api/notifications/overdue             # 期日過ぎ通知
POST /api/notifications/three-month-reminder # 3ヶ月前リマインダー
POST /api/notifications/custom              # カスタム通知
POST /api/notifications/test                # テストメール
```

### エクスポートAPI
```
GET /api/export/events/csv                  # イベントCSV出力
GET /api/export/events/excel                # イベントExcel出力
GET /api/export/dashboard/report            # ダッシュボードレポート
```

### GoogleドライブAPI
```
GET  /api/google-drive/status               # 連携状態確認
POST /api/google-drive/generate-report      # レポート生成
GET  /api/google-drive/summary-data         # 集計データ取得
```

---

## 🖥️ フロントエンド仕様

### ページ構成

#### 1. 認証ページ
- **Login.js**: ログイン画面
- 機能: ユーザー認証、パスワードリセット

#### 2. ダッシュボード
- **Dashboard.js**: メインダッシュボード
- 機能: 統計表示、グラフ表示、クイックアクセス

#### 3. イベント管理
- **EventList.js**: イベント一覧
- **EventForm.js**: イベント作成・編集
- **EventDetail.js**: イベント詳細
- **EventMultiView.js**: マルチビュー表示
- **EventCalendar.js**: カレンダー表示

#### 4. マスタ管理
- **MunicipalityManagement.js**: 市区町村管理
- **DevelopmentAreaManagement.js**: 開拓地域管理
- **VenueHistoryManagement.js**: 実施リスト管理
- **SchoolManagement.js**: 小学校管理
- **UserManagement.js**: ユーザー管理

#### 5. 通知管理
- **NotificationManagement.js**: 通知設定・管理

#### 6. 設定・レポート
- **Settings.js**: システム設定
- **Reports.js**: レポート生成

### コンポーネント構成
```
src/
├── components/
│   ├── Header.js          # ヘッダーコンポーネント
│   ├── Sidebar.js         # サイドバーコンポーネント
│   ├── MasterTable.js     # マスタテーブルコンポーネント
│   └── ProtectedRoute.js  # 認証保護ルート
├── contexts/
│   ├── AuthContext.js     # 認証コンテキスト
│   └── ThemeContext.js    # テーマコンテキスト
└── services/
    ├── api.js             # API呼び出しサービス
    └── apiService.js      # APIサービス
```

---

## ⚙️ 機能仕様

### 1. イベント管理機能

#### 基本機能
- **イベント作成**: 開催年・月、ライン数、開催地を指定してイベント作成
- **イベント編集**: 既存イベントの情報更新
- **イベント削除**: イベントの削除（論理削除対応）
- **ステータス管理**: 6段階のステータス管理

#### 表示機能
- **テーブル表示**: 一覧形式での表示
- **カード表示**: カード形式での表示
- **カレンダー表示**: カレンダー形式での表示
- **ダッシュボード表示**: 統計情報付き表示

#### 検索・フィルタリング
- **キーワード検索**: イベント名、備考での検索
- **期間フィルタ**: 開催期間での絞り込み
- **地域フィルタ**: 開催地での絞り込み
- **ステータスフィルタ**: ステータスでの絞り込み

### 2. 地域データ管理機能

#### 市区町村管理
- **88市区町村対応**: 関東・関西・中部・九州・東北地方
- **地域別分類**: 都道府県・地域での分類
- **人口カテゴリ**: 人口規模での分類
- **優先度管理**: 開拓優先度の設定

#### 開拓地域管理
- **目標管理**: 目標ライン数の設定
- **進捗管理**: 現在ライン数の管理
- **担当者管理**: 担当者・連絡先の管理
- **開発状況**: 未着手・進行中・完了の管理

### 3. ダッシュボード機能

#### 統計表示
- **イベント数統計**: 月別・年別イベント数
- **地域別分布**: 地域別イベント分布
- **ステータス分布**: ステータス別分布
- **進捗率**: 目標達成率の表示

#### グラフ表示
- **Chart.js使用**: 棒グラフ・円グラフ・折れ線グラフ
- **レスポンシブ対応**: 画面サイズに応じた表示
- **インタラクティブ**: クリック・ホバーでの詳細表示

### 4. 通知機能

#### 自動通知
- **チラシ配布通知**: 1週間以内のチラシ配布予定
- **期日過ぎ通知**: 開催予定日が過ぎたイベント
- **3ヶ月前リマインダー**: 継続開催の3ヶ月前通知

#### 手動通知
- **カスタム通知**: 管理者による任意メール送信
- **テストメール**: 通知設定のテスト

---

## 🤖 自動化機能

### スケジュールタスク

#### 1. ステータス自動更新（毎日午前6時）
```javascript
cron.schedule('0 6 * * *', async () => {
    // イベントステータスの自動更新
    // 該当月 → 実施中
    // 該当月過ぎ → 実施済み
});
```

#### 2. 次年度候補生成・リマインダー（毎日午前1時）
```javascript
cron.schedule('0 1 * * *', async () => {
    // 実施済みから次年度候補自動生成
    // 3ヶ月前リマインダー送信
});
```

#### 3. 通知チェック（毎日午前9時）
```javascript
cron.schedule('0 9 * * *', async () => {
    // チラシ配布日通知
    // 期日過ぎ通知
});
```

#### 4. 月次レポート（毎月1日午前0時）
```javascript
cron.schedule('0 0 1 * *', async () => {
    // 月次レポート自動生成
});
```

#### 5. Googleドライブ連携（毎月1日午前2時）
```javascript
cron.schedule('0 2 1 * *', async () => {
    // Googleドライブ月次レポート生成
});
```

#### 6. データベース最適化（毎週日曜日午前3時）
```javascript
cron.schedule('0 3 * * 0', async () => {
    // データベース最適化実行
});
```

---

## 🔒 セキュリティ仕様

### 認証・認可
- **JWT認証**: JSON Web Tokenによる認証
- **ロールベースアクセス制御**: 管理者・一般ユーザーの権限分離
- **セッション管理**: トークンの有効期限管理

### データ保護
- **パスワードハッシュ化**: bcryptによる安全なハッシュ化
- **入力値検証**: Joiによるバリデーション
- **SQLインジェクション対策**: Sequelize ORM使用

### API セキュリティ
- **Rate Limiting**: 15分間で100リクエスト制限
- **CORS設定**: 許可されたオリジンのみアクセス
- **Helmet.js**: セキュリティヘッダー設定

### 環境変数管理
- **機密情報分離**: .envファイルによる環境変数管理
- **本番環境設定**: 強力なシークレットキー使用

---

## 🚀 運用仕様

### デプロイメント
- **開発環境**: localhost:3000 (フロントエンド), localhost:3001 (バックエンド)
- **本番環境**: PM2 + Nginx構成推奨
- **Heroku対応**: heroku-postbuildスクリプト対応

### バックアップ
- **データベース**: SQLiteファイルの定期バックアップ
- **設定ファイル**: 環境変数・設定ファイルのバックアップ
- **ログファイル**: アプリケーションログの保存

### 監視・ログ
- **Morgan**: HTTPリクエストログ
- **エラーログ**: アプリケーションエラーの記録
- **パフォーマンス監視**: レスポンス時間の監視

### メンテナンス
- **依存関係更新**: 定期的なnpm audit実行
- **データベース最適化**: 週次での最適化実行
- **ログローテーション**: ログファイルの定期整理

---

## 💻 技術仕様

### 開発環境要件
- **Node.js**: v16.0.0以上
- **npm**: v8.0.0以上
- **OS**: Windows, macOS, Linux対応

### 本番環境要件
- **サーバー**: VPSまたはクラウドサーバー
- **メモリ**: 最低1GB RAM
- **ストレージ**: 最低10GB空き容量
- **ネットワーク**: HTTPS対応推奨

### パフォーマンス仕様
- **レスポンス時間**: API応答時間 500ms以下
- **同時接続数**: 100ユーザー同時接続対応
- **データベース**: SQLiteによる軽量設計

### ブラウザ対応
- **Chrome**: 最新版推奨
- **Firefox**: 最新版対応
- **Safari**: 最新版対応
- **Edge**: 最新版対応

---

## 📊 データフロー

### イベント作成フロー
```
1. ユーザーがイベント作成画面にアクセス
2. 開催地・年月・ライン数を入力
3. フロントエンドでバリデーション実行
4. API経由でバックエンドにデータ送信
5. データベースにイベント保存
6. 成功レスポンスをフロントエンドに返却
7. イベント一覧画面にリダイレクト
```

### 通知フロー
```
1. cronジョブが定期実行
2. 条件に合致するイベントを検索
3. 通知対象者を特定
4. メールテンプレートを生成
5. Nodemailerでメール送信
6. 送信ログを記録
```

### レポート生成フロー
```
1. 月次レポート生成トリガー
2. 該当月のデータを集計
3. ExcelJSでレポートファイル生成
4. Googleドライブにアップロード
5. 完了通知を管理者に送信
```

---

## 🔧 設定・カスタマイズ

### 環境変数設定
```env
# サーバー設定
PORT=3001
NODE_ENV=development

# データベース設定
DB_PATH=./database.sqlite

# JWT設定
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# メール設定
MAIL_SERVICE=gmail
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password

# Googleドライブ設定
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./config/google-service-account.json
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
```

### カスタマイズ可能項目
- **通知設定**: メールテンプレート・送信タイミング
- **ダッシュボード**: 表示項目・グラフ種類
- **地域データ**: 市区町村・地域の追加
- **ステータス**: イベントステータスの追加・変更

---

## 📈 今後の拡張予定

### 短期計画（3ヶ月以内）
- **モバイル対応**: レスポンシブデザインの改善
- **多言語対応**: 英語・中国語対応
- **API拡張**: 外部システム連携API

### 中期計画（6ヶ月以内）
- **リアルタイム通知**: WebSocket対応
- **高度な分析**: 機械学習による予測機能
- **クラウド対応**: AWS・Azure対応

### 長期計画（1年以内）
- **マイクロサービス化**: サービス分割
- **AI機能**: 自動スケジューリング
- **国際展開**: 多国対応

---

**文書作成日**: 2024年12月
**バージョン**: 1.0.0
**作成者**: CPC管理システム開発チーム
