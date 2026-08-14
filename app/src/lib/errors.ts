// ドメイン別エラーコード。
// createError() はサーバー側で detail をログに残し、クライアントには
// 定型の日本語メッセージ + コードのみを返す(内部情報を漏らさない)。

export const ERROR_MESSAGES = {
  AUTH_001: "ログインが必要です。",
  AUTH_002: "メールアドレスまたはパスワードが正しくありません。",
  AUTH_003: "認証処理に失敗しました。",

  SCH_001: "スクールが見つかりません。",

  MEM_001: "この操作を行う権限がありません。",
  MEM_002: "メンバー情報が見つかりません。",

  CHD_001: "子どもの情報が見つかりません。",
  CHD_002: "お子さまの名前を入力してください。",
  CHD_003: "お子さまの登録に失敗しました。",
  CHD_004: "お子さまの情報の更新に失敗しました。",
  CHD_005: "選択されたカテゴリーまたはクラスが不正です。",

  MST_001: "名称を入力してください。",
  MST_002: "同じ名称がすでに登録されています。",
  MST_003: "カテゴリーの保存に失敗しました。",
  MST_004: "クラスの保存に失敗しました。",

  EVT_001: "イベントが見つかりません。",
  EVT_002: "イベント名と開催日時を入力してください。",
  EVT_003: "イベントの保存に失敗しました。",

  ATT_001: "出欠の更新に失敗しました。",

  INV_001: "招待リンクが無効です。",
  INV_002: "招待リンクの有効期限が切れています。",
  INV_003: "すでにこのスクールのメンバーです。",
  INV_004: "招待の受諾に失敗しました。",
  INV_005: "招待リンクの発行に失敗しました。",
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;

export type ErrorResult = {
  error: string;
  code: ErrorCode;
};

export function createError(code: ErrorCode, detail?: unknown): ErrorResult {
  if (detail !== undefined) {
    console.error(`[${code}]`, detail);
  }
  return { error: ERROR_MESSAGES[code], code };
}

export function isErrorResult(value: unknown): value is ErrorResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    "code" in value
  );
}

export function formatError(result: ErrorResult): string {
  return `${result.error} [${result.code}]`;
}
