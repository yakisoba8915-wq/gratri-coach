# Gratri Coach — Phase 1 MVP

グラトリ練習支援のモバイルファーストNext.jsアプリです。現在はモックデータとlocalStorageで動作し、Supabase未設定でも全画面を確認できます。

## 起動

```bash
npm install
npm run dev
```

## データ層

- 型: `lib/types.ts`
- 初期データ: `lib/mockData.ts`
- 計算: `lib/calculations.ts`
- おすすめ: `lib/recommendations.ts`
- ローカルCRUD: `lib/storage.ts`

Supabaseへ移行する際は `lib/storage.ts` と同じ境界を持つrepositoryへ置換してください。
