# コントリビューションガイドライン

CPC管理サイトプロジェクトへの貢献をありがとうございます！このガイドラインに従って、プロジェクトの改善にご協力ください。

## 🚀 始め方

### 1. プロジェクトのフォーク
1. GitHubでこのリポジトリをフォーク
2. ローカルにクローン：
   ```bash
   git clone https://github.com/YOUR_USERNAME/CPC-Management-site.git
   cd CPC-Management-site
   ```

### 2. 開発環境のセットアップ
```bash
# 依存関係のインストール
npm install
cd client && npm install && cd ..

# 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な設定を行う

# データベースの初期化
npm run seed
```

### 3. ブランチの作成
```bash
git checkout -b feature/your-feature-name
# または
git checkout -b fix/your-bug-fix
```

## 📝 開発ガイドライン

### コードスタイル
- **JavaScript/Node.js**: ESLint + Prettier設定に従う
- **React**: 関数コンポーネントとHooksを使用
- **CSS**: BEM命名規則を推奨
- **コメント**: 日本語で分かりやすく記述

### コミットメッセージ
```
feat: 新機能の追加
fix: バグ修正
docs: ドキュメントの更新
style: コードスタイルの修正
refactor: リファクタリング
test: テストの追加・修正
chore: その他の変更
```

例：
```
feat: イベント管理に検索機能を追加
fix: ダッシュボードの表示バグを修正
docs: READMEにセットアップ手順を追加
```

### ファイル命名規則
- **コンポーネント**: PascalCase (例: `EventForm.js`)
- **ユーティリティ**: camelCase (例: `apiService.js`)
- **CSS**: kebab-case (例: `event-form.css`)
- **定数**: UPPER_SNAKE_CASE (例: `API_ENDPOINTS.js`)

## 🧪 テスト

### テストの実行
```bash
# 全テスト実行
npm test

# 特定のテストファイル実行
npm test -- tests/auth.test.js

# カバレッジ付きテスト
npm run test:coverage
```

### テスト作成ガイドライン
- 各機能に対応するテストを作成
- 正常系・異常系の両方をテスト
- モックを使用して外部依存を分離
- テスト名は日本語で分かりやすく記述

## 🔍 プルリクエスト

### 作成手順
1. 変更をコミット・プッシュ
2. GitHubでプルリクエストを作成
3. テンプレートに従って情報を記入
4. レビュアーを指定

### プルリクエストテンプレート
```markdown
## 変更内容
- [ ] 新機能追加
- [ ] バグ修正
- [ ] ドキュメント更新
- [ ] その他

## 変更の詳細
<!-- 変更内容の詳細説明 -->

## テスト
- [ ] 単体テストを追加・更新
- [ ] 手動テストを実施
- [ ] 既存のテストが通ることを確認

## スクリーンショット（UI変更の場合）
<!-- 変更前後のスクリーンショット -->

## チェックリスト
- [ ] コードがプロジェクトのスタイルガイドに従っている
- [ ] 自己レビューを実施した
- [ ] コメントを追加した（必要に応じて）
- [ ] ドキュメントを更新した（必要に応じて）
- [ ] 変更が既存の機能を壊していない
```

## 🐛 バグ報告

### バグ報告テンプレート
```markdown
## バグの概要
<!-- バグの簡潔な説明 -->

## 再現手順
1.
2.
3.

## 期待される動作
<!-- 正常な動作の説明 -->

## 実際の動作
<!-- バグが発生した際の動作 -->

## 環境情報
- OS:
- ブラウザ:
- バージョン:
- Node.js:

## 追加情報
<!-- スクリーンショット、ログ、その他の情報 -->
```

## 💡 機能提案

### 提案テンプレート
```markdown
## 提案の概要
<!-- 機能の簡潔な説明 -->

## 問題点
<!-- この機能が必要な理由 -->

## 解決策
<!-- 提案する解決方法 -->

## 代替案
<!-- 考えられる代替案 -->

## 追加情報
<!-- 参考資料、スクリーンショットなど -->
```

## 📚 ドキュメント

### ドキュメント更新ガイドライン
- README.mdの更新は必須
- APIドキュメントの更新（新エンドポイント追加時）
- スクリーンショットは最新の状態に保つ
- セットアップ手順の検証

## 🔒 セキュリティ

### セキュリティ関連の変更
- セキュリティ関連の変更は直接プルリクエストを作成せず、セキュリティチームに連絡
- 機密情報（APIキー、パスワードなど）は絶対にコミットしない
- 環境変数を使用して機密情報を管理

## 🎉 リリース

### リリース手順
1. バージョン番号の更新
2. CHANGELOG.mdの更新
3. リリースノートの作成
4. タグの作成・プッシュ

## 📞 サポート

### 質問・相談
- **Issues**: 機能提案やバグ報告
- **Discussions**: 一般的な質問や議論
- **Email**: 緊急時や機密事項

## 🙏 謝辞

プロジェクトへの貢献をありがとうございます。皆様の協力により、CPC管理サイトがより良いものになっています。

---

**注意**: このガイドラインに従わない場合、プルリクエストが拒否される可能性があります。ご理解ください。
