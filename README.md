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
- 診断回答から曜日別の週間オフトレプランをルールベースで生成します。
- オフトレタブの「今週やること」に月〜日のカードを表示し、今日のカードを強調します。
- 現在は場所・時間・能力・不安部位・強度によるルール生成で、将来的にAI APIへ置き換え可能です。
- 週間オフトレは「シバカツの日」と「筋トレ＋柔軟の日」に分けて生成します。
- 練習器具がない場合、シバカツ系の日は「板操作イメージトレーニングの日」として器具なしメニューを表示します。
- 「シバカツの日」はシバカツ専用練習日であり、筋トレ・柔軟・器具なし種目を混在させません。
- シバカツメニューは `lib/shibakatsuMenu.ts` に分離し、動画URLを含むメニューを今後随時追加できる構造です。

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

## 動画アップロード

- Supabase Storage bucket は `practice-videos` を使用します。
- SQL Editorで `supabase/video-storage.sql` を実行すると、`practice_videos` テーブル、RLS、Storage bucket、Storage objects用ポリシーを作成します。
- 対応形式は `mp4` / `mov` / `webm` です。
- 1ファイルあたり最大100MBです。
- 動画は練習記録に複数紐づけできます。
- 未ログイン時は動画アップロードできません。
- 現時点では動画の保存・再生のみで、AI動画解析は未実装です。
- アップロードUIは `components/PracticeVideoUploader.tsx`、動画一覧・再生・削除UIは `components/PracticeVideoList.tsx` に分離しています。
- 動画ファイルは `practice-videos/{user_id}/{practice_log_id}/...` に保存し、メタデータは `practice_videos` に保存します。
## 練習記録タイプ

- 練習記録は「ゲレンデでの滑走」と「シバカツ練習」に分けて保存できます。
- `practice_logs.training_type` は `snow` / `shibakatsu` の2種類です。
- シバカツ練習ではゲレンデ名・雪質は不要です。
- シバカツ練習では、練習メニュー、関連トリック、実施時間、回数、セット数を記録できます。
- 成功率はゲレンデ記録・シバカツ記録の両方で計算できます。
- 既存データは migration 実行時に `snow` として扱われます。

## プロフィール画像登録

- プロフィール画面からアイコン画像を登録できます。
- Supabase Storage bucket は `profile-avatars` を使用します。
- SQL Editorで `supabase/profile-avatar.sql` を実行すると、`profiles.avatar_url` / `profiles.avatar_path` とStorage bucket/policyを追加します。
- Storageパスは `profile-avatars/{user_id}/avatar-{timestamp}.{ext}` です。
- 対応形式は `jpg` / `jpeg` / `png` / `webp` です。
- 最大ファイルサイズは5MBです。
- 未ログイン時はプロフィール画像を設定できません。

## AI練習アドバイス

- `app/api/ai/advice/route.ts` からOpenAI APIを呼び出して、練習アドバイスを生成できます。
- APIキーはクライアント側に出さず、サーバー側環境変数 `OPENAI_API_KEY` のみで使用します。
- Vercelでは Project Settings > Environment Variables に `OPENAI_API_KEY` を設定してください。
- 任意で `OPENAI_MODEL` を設定できます。未設定時はデフォルトモデルを使用します。
- `OPENAI_API_KEY` 未設定時、またはAPIエラー時はルールベース分析にフォールバックします。
- `lib/aiAdvisor.ts` の `generateAdvice()` は初期表示用のローカル解析、`generateAiAdvice()` はAPI Route呼び出し、`generateRuleBasedAdvice()` はフォールバック用です。
- 分析対象は、トリックごとの成功率、直近10回比較、成功率推移、苦手技、練習頻度、最近練習していない技、シバカツ記録、オフトレ実施状況です。
- UIは `components/AIAdviceCard.tsx` で表示します。
- AIアドバイスは `practice_videos` の動画メタデータも考慮します。
- 現時点では動画内容解析は未実装で、動画本数、ファイル名、作成日、紐づく練習記録をAI入力に含めます。
- 将来的に動画フレーム解析・フォーム解析へ拡張予定です。

## AI対話タブ

- 下部ナビゲーションに「AI対話」タブを追加しています。
- 画面は `app/ai-chat/page.tsx`、チャットUIは `components/AIChat.tsx` です。
- API Routeは `app/api/ai/chat/route.ts` です。
- OpenAI APIを使う場合はサーバー側環境変数 `OPENAI_API_KEY` を設定してください。
- `OPENAI_API_KEY` 未設定時、またはAPIエラー時はルールベース回答を返します。
- 未ログイン時もAI対話画面は閲覧できますが、ログインすると練習記録や目標に合わせた個別アドバイス用データをAPIに渡せます。
- チャット履歴のSupabase保存は未実装です。現在は画面内stateで管理しています。
## AI動画解析準備機能

- 練習記録の動画一覧から「AI解析」を実行できます。
- ブラウザ上の `video` 要素と `canvas` を使い、アップロード済み動画の 25% / 50% / 75% 地点から代表フレームを抽出します。
- 抽出したフレームは Supabase Storage bucket `practice-video-frames` に保存します。
- フレームメタデータは `practice_video_frames` テーブルに保存します。SQL Editorで `supabase/video-frames.sql` を実行してください。
- 保存パスは Storage bucket 配下で `{user_id}/{practice_video_id}/frame-{index}.jpg` です。
- `app/api/ai/video-analysis/route.ts` はサーバー側で `OPENAI_API_KEY` を使い、静止画ベースの簡易解析を行います。
- `OPENAI_API_KEY` が未設定、またはAPIエラー時は「AI動画解析は現在利用できません。動画と練習記録をもとに、自己分析メモを残してください。」を表示します。
- 現時点では動画全体のフォーム解析ではなく、代表フレーム画像と練習記録を使った準備機能です。
- 将来的に動画全体解析・フレーム連続解析・OpenAI Visionによるフォーム解析へ拡張予定です。

## AI動画解析結果の保存・比較

- AI動画解析結果は `practice_video_analysis_results` テーブルに保存します。
- SQL Editorで `supabase/video-analysis-results.sql` を実行してください。
- 保存項目は summary、likelyIssues、improvementPoints、nextPractice、shibakatsuAdvice、confidence です。
- `user_id` によるRLSで、自分の解析結果だけ select / insert / update / delete できます。
- 練習記録一覧の動画カードでは、保存済みの過去AI解析結果を再表示できます。
- 同じ `trick_id` の過去解析結果と最新結果を比較し、以下を表示します。
  - 以前から続いている課題
  - 改善している点
  - 新しく出てきた課題
  - 次回重点ポイント

## AI動画解析結果の練習メニュー反映

- AI動画解析結果から、次回課題、次に練習すべき技、シバカツ補強、筋トレ＋柔軟補強を自動生成します。
- 「次回課題に反映する」ボタンで `practice_logs.next_task` に反映できます。
- 「この解析を練習メニューに反映」ボタンで、次回課題とオフトレ週間プランへまとめて反映できます。
- 反映前には確認ダイアログを表示し、ユーザーが確認した場合のみ更新します。
- オフトレ週間プランでは、シバカツの日にシバカツ補強、筋トレ＋柔軟の日に筋トレ・柔軟補強を追加します。
- 反映履歴は `ai_advice_actions` テーブルに保存します。SQL Editorで `supabase/ai-advice-actions.sql` を実行してください。
- `ai_advice_actions` は `user_id` によるRLSで、自分の反映履歴だけ select / insert / update / delete できます。

## AIコーチ履歴保存・文脈参照

- AI対話タブのユーザー発言とAI回答を `ai_coach_messages` テーブルに保存します。
- SQL Editorで `supabase/ai-coach-memory.sql` を実行してください。
- AI対話画面を開くと、保存済みのチャット履歴を取得して再表示します。
- AI回答時には、過去の相談内容、最近の練習記録、苦手技、動画解析結果、オフトレ反映履歴を一部コンテキストとして渡します。
- AI練習アドバイス、AI動画解析結果、練習メニュー反映履歴もAIコーチ履歴として保存し、次回以降の回答で参照できるようにしています。
- AI対話画面の「履歴をリセット」から、確認後にAIコーチ履歴を削除できます。
- `ai_coach_messages` は `user_id` によるRLSで、自分のAI履歴だけ select / insert / update / delete できます。
