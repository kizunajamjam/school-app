// デモ／プロトタイプ用のアカウントを作成する。
//
// ⚠️ 本番データを入れる前に、これらのアカウントは必ず削除するかパスワードを変更すること。
//    弱いパスワードの管理者が居る状態でスクールの実データを入れてはいけない。
//
// 使い方（school-app/app で実行）:
//   node --env-file=.env.local scripts/create-demo-user.mjs <email> <password> [表示名] [admin|guardian]
//
// 通常、保護者は招待リンク経由で参加する。このスクリプトはデモ用に直接作るためのもの。

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が読めません。");
  process.exit(1);
}

const [email, password, displayName = "デモユーザー", role = "admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    "使い方: node --env-file=.env.local scripts/create-demo-user.mjs <email> <password> [表示名] [admin|guardian]",
  );
  process.exit(1);
}

if (role !== "admin" && role !== "guardian") {
  console.error(`role は admin か guardian のみ: ${role}`);
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1) ユーザーを作る（既に居ればパスワードを上書きする）
async function upsertUser() {
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (!created.error) return created.data.user;

  const alreadyExists =
    created.error.code === "email_exists" || /already been registered/i.test(created.error.message);
  if (!alreadyExists) throw created.error;

  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw new Error(`${email} は登録済みのはずだが見つからない`);

  const updated = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (updated.error) throw updated.error;

  console.log("既存ユーザーのパスワードを更新しました。");
  return updated.data.user;
}

const user = await upsertUser();
console.log(`user: ${user.email} (${user.id})`);

// 2) スクールを取る（単一スクール専用アプリなので1件のはず）
const { data: schools, error: schoolError } = await admin
  .from("schools")
  .select("id, name")
  .order("created_at", { ascending: true });

if (schoolError) throw schoolError;
if (!schools?.length) {
  console.error("スクールが1件もありません。先に schools へ1行 insert してください。");
  process.exit(1);
}
if (schools.length > 1) {
  console.warn(`スクールが ${schools.length} 件あります。先頭を使います。`);
}

const school = schools[0];

// 3) 指定ロールで所属させる
const ROLE_LABEL = { admin: "管理者", guardian: "保護者" };

const { data: member } = await admin
  .from("school_members")
  .select("id, role")
  .eq("school_id", school.id)
  .eq("user_id", user.id)
  .maybeSingle();

if (!member) {
  const { error } = await admin
    .from("school_members")
    .insert({ school_id: school.id, user_id: user.id, role });
  if (error) throw error;
  console.log(`「${school.name}」に${ROLE_LABEL[role]}として追加しました。`);
} else if (member.role !== role) {
  const { error } = await admin.from("school_members").update({ role }).eq("id", member.id);
  if (error) throw error;
  console.log(`「${school.name}」での役割を${ROLE_LABEL[role]}に変更しました。`);
} else {
  console.log(`すでに「${school.name}」の${ROLE_LABEL[role]}です。`);
}

console.log("\n完了。ログイン情報:");
console.log(`  ${email} / ${password}  (${ROLE_LABEL[role]})`);
