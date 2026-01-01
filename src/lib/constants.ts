// 自動生成: Excel Lists シートから
// Generated: 2026-01-01T12:59:49.385Z

export const RESULT_OPTIONS = [
  "Correct",
  "Partial",
  "Wrong",
  "Skipped"
] as const;

export const MISS_TYPES = [
  "計算ミス",
  "読み違い",
  "知識不足",
  "方針ミス",
  "時間切れ",
  "ケアレス(転記/単位)",
  "未分類"
] as const;

export const TAG_GROUPS = [
  "計算",
  "整数・数論",
  "場合の数",
  "割合・比",
  "速さ",
  "文章題",
  "平面図形",
  "立体図形",
  "グラフ・資料",
  "その他"
] as const;

export type Result = typeof RESULT_OPTIONS[number];
export type MissType = typeof MISS_TYPES[number];
export type TagGroup = typeof TAG_GROUPS[number];
