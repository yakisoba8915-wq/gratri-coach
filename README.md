# Gratri Coach — Phase 1 MVP

グラトリ練習支援のモバイルファーストNext.jsアプリです。Supabaseでクラウド保存し、未設定時や接続失敗時はlocalStorageへ自動フォールバックします。

## 起動

```bash
npm install
npm run dev
```

## Supabaseセットアップ

1. Supabaseでプロジェクトを作成します。
2. SQL Editorで `supabase/schema.sql` を実行します。
3. `.env.local` を作成し、Project Settings > APIの値を設定します。

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. 開発サーバーを再起動します。

Supabaseへの読み書きが失敗した場合に備えてlocalStorageフォールバックは維持しています。ただし、未ログイン時のゲストデータは画面表示には使用しません。

## Googleログイン設定

1. `supabase/schema.sql` 適用済みのプロジェクトで、SQL Editorから `supabase/auth-migration.sql` を実行します。
2. Supabase Dashboardの Authentication > Providers > Google を開き、Google Providerを有効にします。
3. Google Cloud ConsoleでOAuth 2.0クライアントを作成し、Supabase画面に表示されるCallback URLを「承認済みのリダイレクトURI」へ登録します。
4. GoogleのClient IDとClient SecretをSupabaseのGoogle Provider設定へ入力します。
5. Authentication > URL ConfigurationでSite URLを設定し、Redirect URLsへ以下を追加します。
   - ローカル: `http://localhost:3000/profile`
   - 本番: `https://your-domain.example/profile`
6. アプリのプロフィール画面から「Googleログイン」を選択します。

ログイン中は各テーブルの `user_id` とRLSによりユーザーごとにデータが分離されます。既存の認証前データは自動ではユーザーへ移行されません。

## 未ログイン時の利用範囲

- アプリを開くとログイン促進モーダルを表示します。
- 「あとで使う」を選ぶと、そのブラウザセッション中はモーダルを閉じてゲスト閲覧できます。
- Googleログイン後、プロフィールが未設定の場合はユーザー名とスタンスの初期設定を表示します。
- トリック辞典と技ツリーはログインせずに閲覧できます。
- 成功率、習得状況、お気に入りなどのユーザー固有情報は表示しません。
- 練習記録、目標管理、プロフィール保存はGoogleログイン後に利用できます。
- 未ログイン時はモックデータや過去のゲスト用localStorageデータを表示しません。

## オフトレ診断

- ログイン後、初めてオフトレタブを開くと最大10問の対話形式診断を表示します。
- 回答は `offtraining_preferences`、生成プランは `offtraining_plans` にユーザー単位で保存します。
- 器具、場所、伸ばしたい能力、身体の不安、強度などからルールベースで週間プランを生成します。
- 器具、場所、能力、目標技、不安部位は複数選択に対応し、回答をSupabaseの `text[]` として保存します。
- 既存環境では `supabase/offtraining-multiselect-migration.sql` を実行すると、旧文字列データを保持したまま配列形式へ移行できます。
- `supabase/offtraining-plan.sql` をSupabase SQL Editorで実行してから利用してください。
- 生成処理は `lib/offTrainingPlanner.ts` に分離してあり、将来的にAI APIへ置き換え可能です。
- オフトレ診断は「もう一度診断する」から何度でもやり直せます。
- 再診断で保存すると、現在の回答とプランを `user_id` 基準のupsertで上書き更新します。

## データ層

- 型: `lib/types.ts`
- 初期データ: `lib/mockData.ts`
- 計算: `lib/calculations.ts`
- おすすめ: `lib/recommendations.ts`
- Supabaseクライアント: `lib/supabase.ts`
- 認証処理: `lib/auth.ts`
- Supabase/localStorageリポジトリ: `lib/storage.ts`
- DBスキーマ: `supabase/schema.sql`
- Auth移行SQL: `supabase/auth-migration.sql`
- オフトレプランSQL: `supabase/offtraining-plan.sql`
- オフトレ複数選択移行SQL: `supabase/offtraining-multiselect-migration.sql`

UIは `lib/storage.ts` のデータリポジトリだけを参照するため、保存先の詳細から分離されています。
