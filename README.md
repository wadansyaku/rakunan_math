# 洛南 算数 過去問 復習システム

洛南中学校 算数過去問の復習管理・解答ログWebアプリケーションです。
ExcelベースのログシステムをWebアプリに置き換え、安定した運用を実現します。

## 機能

- **ホーム** - 今日の概要（期限切れ件数/予定/直近ログ）
- **QuickLog** - 授業中に1行で解答を記録
- **問題バンク** - 問題の検索・フィルタ
- **復習リスト** - 期限切れ・誤答優先で今日やる問題を自動リスト化
- **正答管理** - 正答の登録/編集
- **インポート** - CSV/Excelからのデータ取り込み
- **整合性チェック** - 欠損・ID不整合の検知

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **データベース**: Prisma + PostgreSQL（Vercel Postgres）
- **ビルド**: Webpack (Turbopackは日本語パス未対応のため)

## セットアップ

### 前提条件

- Node.js 18以上
- npm

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd rakunan-math-review

# 依存関係をインストール
npm install

# Prismaクライアントを生成
npm run prisma:generate

# データベースをマイグレーション（Postgres）
npm run db:migrate

# 初期データを投入（問題/解答）
RESET_DB=true npm run import:excel
npx tsx scripts/import-answers.ts
```

### 開発サーバーの起動

```bash
# webpackモードで開発サーバーを起動（推奨）
npm run dev -- --webpack

# ブラウザで http://localhost:3000 を開く
```

### ビルド

```bash
npm run build
npm run start
```

## 環境変数

```.env
# DB（Postgres）
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"

# Claude on Vertex（将来用、オプション）
GOOGLE_CLOUD_PROJECT=""
GOOGLE_CLOUD_LOCATION="global"
VERTEX_CLAUDE_MODEL="claude-3-7-sonnet@20250219"
```

## Vercelデプロイ

1. Vercelで新規プロジェクトを作成し、Vercel Postgresを追加  
2. Vercel Postgresの環境変数が自動で追加されていることを確認  
   - `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` が存在する  
3. 必要なら `DATABASE_URL` / `DIRECT_URL` を上記の値で上書き  
3. ローカルで `npm run db:migrate` を実行してテーブル作成  
4. `RESET_DB=true npm run import:excel` → `npx tsx scripts/import-answers.ts` を実行  

## NPM Scripts

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバーを起動 |
| `npm run lint` | ESLintを実行 |
| `npm run db:seed` | シードデータを投入 |
| `npm run db:reset` | DBをリセット |
| `npm run db:migrate` | マイグレーションを実行 |
| `npm run db:deploy` | 本番環境へマイグレーションを適用 |
| `npm run prisma:generate` | Prismaクライアントを生成 |
| `npm run import:excel` | 問題/タグのデータを取り込み |

## データ構造

### Question（問題）
- `id`: 問題ID（例: 2024-Q1(1)）
- `year`: 年度
- `section`: 大問番号
- `sub`: 小問番号
- `difficulty`: 難易度（1-5）
- `correctText`: 正答
- `tag1`, `tag2`, `tag3`: タグ
- その他メタ情報

### AnswerLog（解答ログ）
- `studyDate`: 実施日（YYYY-MM-DD, JST）
- `questionId`: 問題ID
- `result`: Correct/Partial/Wrong/Skipped
- `missType`: ミス分類
- `minutes`: 解答時間
- `studentAns`: 生徒の解答
- `autoJudge`: 自動判定（MATCH/NO）

## CSVインポート形式

### Questions.csv
```csv
問題ID,年度,大問,小問,大問タイトル,タグ1,タグ2,難易度,正答,単位
2024-Q1(1),2024,1,(1),計算問題,計算,四則演算,2,42,
```

### AnswerLog.csv
```csv
実施日,問題ID,結果,ミス分類,解答時間,メモ
2024-12-01,2024-Q1(1),Correct,,2.5,問題なし
```

## ライセンス

MIT

## 開発ロードマップ

- [x] P1: プロジェクト初期化
- [ ] P2: Excel/CSVインポート
- [ ] P3: QuickLog機能
- [ ] P4: 復習リスト
- [ ] P5: 整合性チェック
- [ ] P6: Claude連携（オプション）
- [ ] P7: エクスポート
- [ ] P8: テスト
- [ ] P9: 運用ドキュメント
