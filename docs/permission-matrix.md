# Gratri Coach 権限・課金境界

決済導入前の `plan_type` ベースの権限表です。未ログインユーザーは原則 `free` 相当として扱います。

| 機能 | 未ログイン | free | premium | beta_tester | editor | admin |
|---|---|---|---|---|---|---|
| トリック一覧 | 初期20トリック利用可 / Premiumトリックはロック表示 | 初期20トリック利用可 / Premiumトリックはロック表示 | 全トリック利用可 | 全トリック利用可 | 全トリック利用可 | 全トリック利用可 |
| トリック詳細 | Premium詳細は閲覧不可 / Premium案内表示 | Premium詳細は閲覧不可 / Premium案内表示 | 閲覧可 | 閲覧可 | 閲覧可 | 閲覧可 |
| 練習記録追加 | 不可 | 初期20トリックと `access_type = free` の追加トリックのみ選択可 | 全トリック選択可 | 全トリック選択可 | 全トリック選択可 | 全トリック選択可 |
| シバカツトリック | 通常トリックと同じ制御 | 通常トリックと同じ制御 | 全件利用可 | 全件利用可 | 全件利用可 | 全件利用可 |
| AI対話 | 利用可 | 3回/日 | 50回/日 | 50回/日 | 50回/日 | 無制限 |
| AI練習アドバイス | 画面上はログイン後利用 | 3回/日 | 50回/日 | 50回/日 | 50回/日 | 無制限 |
| AI動画解析 | 開発中のため利用不可 | 開発中のため利用不可 | 開発中のため利用不可 | 開発中のため利用不可 | 開発中のため利用不可 | 開発中のため利用不可 |
| 技追加 | 不可 | 管理パスワード入力で可能 | 管理パスワード入力で可能 | 管理パスワード入力で可能 | パスワード不要 | パスワード不要 |
| 技編集 | 不可 | 不可 | 不可 | 不可 | 可能 | 可能 |
| 技削除 | 不可 | 不可 | 不可 | 不可 | 可能 | 可能 |
| 管理者ページ `/admin` | 不可 | 不可 | 不可 | 不可 | 不可 | 可能 |
| Premiumページ `/premium` | Premium案内 | Premium案内 | Premium利用中表示 | βテスター無料体験中表示 | 運営権限表示 | 運営権限表示 |
| プロフィール plan表示 | Free相当 | Free | Premium | Beta Tester | Editor | Admin |

## 実装上の共通判定

- `lib/accessControl.ts`
  - `isPremiumPlan()`
  - `canUsePremiumTricks()`
  - `canUseTrick()`
  - `canManageTricks()`
  - `canEditTricks()`
  - `canDeleteTricks()`
  - `canAccessAdminPage()`
  - `canUseAI()`
  - `isAiUnlimited()`
  - `aiLimitPlan()`

## API側の保護

- `/api/tricks/create`
  - ログイン必須
  - `editor` / `admin` は管理パスワード不要
  - `free` / `premium` / `beta_tester` は `TRICK_ADMIN_PASSWORD` 必須
- `/api/tricks/[id]`
  - `PATCH` / `DELETE` は `editor` / `admin` のみ
  - 管理パスワードでは編集・削除不可
- `/api/admin/*`
  - `admin` のみ
  - service role key はAPI Route内でのみ使用
- `/api/ai/chat`
  - 未ログインでも利用可能
  - ログイン時は `ai_usage_logs` による日次制限
- `/api/ai/advice`
  - ログイン時は `ai_usage_logs` による日次制限
- `/api/ai/video-analysis`
  - 現在は開発中のためサーバー側でも利用不可

## 注意

- Stripeなどの実決済は未実装です。
- `premium` / `beta_tester` / `editor` / `admin` の付与は、現時点ではSupabaseの `profiles.plan_type` または管理者ページから行います。
