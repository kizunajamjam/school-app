// デモ／プロトタイプ用のテストデータを投入する。
//
// ⚠️ 破壊的: 既存のイベントを全削除し、会員も「残す保護者」以外の分を削除してから作り直す。
//    実データが入っている環境では絶対に実行しないこと。
//
// 使い方（school-app/app で実行）:
//   node --env-file=.env.local scripts/seed-demo-data.mjs
//
// 投入するもの:
//   - カテゴリー / クラスのマスタ
//   - 保護者アカウント（兄弟がいる家庭を含む）
//   - 会員 20人
//   - イベント 10件（過去・今後の混在）
//   - 出欠（過去はほぼ回答済み、先のイベントほど未回答が多い）と、その変更履歴

import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// 既存のデモ保護者は消さずに残す（このアカウントでログインして見せるため）
const KEEP_GUARDIAN_EMAIL = "parent@test.com";
const DEMO_PASSWORD = "123456";

// 実行のたびに同じ結果になるよう、乱数は固定シードにする
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260815);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

function must(label, { error }) {
  if (error) {
    console.error(`${label} で失敗:`, error);
    process.exit(1);
  }
}

// ── スクールを取得 ─────────────────────────────────────────────────────
const { data: schools } = await admin
  .from("schools")
  .select("id, name")
  .order("created_at", { ascending: true });

if (!schools?.length) {
  console.error("スクールがありません。先に schools へ1行 insert してください。");
  process.exit(1);
}
const school = schools[0];
console.log(`対象スクール: ${school.name}`);

// ── 既存データの掃除 ───────────────────────────────────────────────────
const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
const keepGuardian = users.users.find((u) => u.email === KEEP_GUARDIAN_EMAIL);

must("イベント削除", await admin.from("events").delete().eq("school_id", school.id));

let deleteChildren = admin.from("children").delete().eq("school_id", school.id);
if (keepGuardian) deleteChildren = deleteChildren.neq("guardian_id", keepGuardian.id);
must("会員削除", await deleteChildren);

console.log("既存のイベントと会員を掃除しました。");

// ── マスタ（カテゴリー / クラス）──────────────────────────────────────
async function upsertMaster(table, names) {
  const result = {};
  for (const name of names) {
    const { data: existing } = await admin
      .from(table)
      .select("id")
      .eq("school_id", school.id)
      .eq("name", name)
      .maybeSingle();

    if (existing) {
      result[name] = existing.id;
      continue;
    }
    const { data, error } = await admin
      .from(table)
      .insert({ school_id: school.id, name })
      .select("id")
      .single();
    must(`${table} 作成`, { error });
    result[name] = data.id;
  }
  return result;
}

const categories = await upsertMaster("categories", ["U-8", "U-10", "U-12"]);
const classes = await upsertMaster("classes", ["火曜クラス", "木曜クラス", "土曜クラス"]);
console.log("カテゴリー・クラスを整えました。");

// ── 保護者アカウント ───────────────────────────────────────────────────
async function ensureGuardian(index, displayName) {
  const email = `parent${String(index).padStart(2, "0")}@test.com`;
  const existing = users.users.find((u) => u.email === email);

  let userId;
  if (existing) {
    userId = existing.id;
    await admin.auth.admin.updateUserById(userId, {
      password: DEMO_PASSWORD,
      user_metadata: { display_name: displayName },
    });
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    must(`${email} 作成`, { error });
    userId = data.user.id;
  }

  // 表示名はトリガーで作られた profiles にも反映しておく
  await admin.from("profiles").update({ display_name: displayName }).eq("id", userId);

  const { data: member } = await admin
    .from("school_members")
    .select("id")
    .eq("school_id", school.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!member) {
    must(
      "所属追加",
      await admin
        .from("school_members")
        .insert({ school_id: school.id, user_id: userId, role: "guardian" }),
    );
  }

  return { email, userId };
}

// 家庭ごとの子ども。姓を揃えた2人は兄弟。合計18人（デモ保護者の2人と合わせて20人）
const FAMILIES = [
  { guardian: "佐藤 美咲", children: [["佐藤 大翔", "小学3年"]] },
  { guardian: "鈴木 健一", children: [["鈴木 陽菜", "小学1年"], ["鈴木 悠斗", "小学4年"]] },
  { guardian: "高橋 由紀", children: [["高橋 蓮", "小学5年"]] },
  { guardian: "田中 慎二", children: [["田中 結衣", "小学2年"]] },
  { guardian: "伊藤 香織", children: [["伊藤 湊", "小学6年"], ["伊藤 咲良", "小学3年"]] },
  { guardian: "渡辺 拓也", children: [["渡辺 陸", "小学4年"]] },
  { guardian: "山本 恵子", children: [["山本 楓", "小学2年"]] },
  { guardian: "中村 大輔", children: [["中村 颯太", "小学5年"]] },
  { guardian: "小林 麻衣", children: [["小林 芽依", "小学1年"]] },
  { guardian: "加藤 直樹", children: [["加藤 樹", "小学6年"], ["加藤 心春", "小学2年"]] },
  { guardian: "吉田 千尋", children: [["吉田 蒼", "小学3年"]] },
  { guardian: "山田 智也", children: [["山田 莉子", "小学4年"]] },
  { guardian: "佐々木 遥", children: [["佐々木 律", "小学5年"]] },
  { guardian: "松本 和也", children: [["松本 陽翔", "小学1年"]] },
  { guardian: "井上 里奈", children: [["井上 澪", "小学6年"]] },
];

// 学年からカテゴリーを決める（U-8: 1〜2年、U-10: 3〜4年、U-12: 5〜6年）
function categoryForGrade(grade) {
  const year = Number(grade.replace(/[^0-9]/g, ""));
  if (year <= 2) return categories["U-8"];
  if (year <= 4) return categories["U-10"];
  return categories["U-12"];
}

const classNames = Object.keys(classes);
const childRows = [];

for (const [i, family] of FAMILIES.entries()) {
  const { userId } = await ensureGuardian(i + 1, family.guardian);
  for (const [name, grade] of family.children) {
    childRows.push({
      school_id: school.id,
      guardian_id: userId,
      name,
      grade,
      category_id: categoryForGrade(grade),
      class_id: classes[pick(classNames)],
    });
  }
}

const { data: insertedChildren, error: childError } = await admin
  .from("children")
  .insert(childRows)
  .select("id, name");
must("会員作成", { error: childError });

// デモ保護者の既存の子どもも対象に含める
const { data: allChildren } = await admin
  .from("children")
  .select("id, name")
  .eq("school_id", school.id);

console.log(
  `保護者 ${FAMILIES.length} 名を作成し、会員 ${insertedChildren.length} 人を追加（合計 ${allChildren.length} 人）。`,
);

// ── イベント ───────────────────────────────────────────────────────────
// 日本時間で指定する（サーバーのタイムゾーンに依存させない）
const jst = (date, time) => new Date(`${date}T${time}:00+09:00`).toISOString();

const EVENTS = [
  { title: "週末練習", type: "practice", date: "2026-07-11", time: "09:00", location: "市民グラウンド" },
  { title: "練習試合 vs 青葉FC", type: "match", date: "2026-07-19", time: "10:00", location: "青葉総合公園" },
  { title: "週末練習", type: "practice", date: "2026-07-25", time: "09:00", location: "市民グラウンド" },
  { title: "夏季合同練習", type: "practice", date: "2026-08-01", time: "08:30", location: "河川敷グラウンド" },
  { title: "月例カップ 予選", type: "match", date: "2026-08-08", time: "13:00", location: "中央公園グラウンド" },
  { title: "週末練習", type: "practice", date: "2026-08-22", time: "09:00", location: "市民グラウンド" },
  { title: "練習試合 vs みどり台SC", type: "match", date: "2026-08-29", time: "13:00", location: "中央公園グラウンド" },
  { title: "週末練習", type: "practice", date: "2026-09-05", time: "09:00", location: "市民グラウンド" },
  { title: "秋季大会 1回戦", type: "match", date: "2026-09-13", time: "11:00", location: "県営陸上競技場" },
  { title: "週末練習", type: "practice", date: "2026-09-19", time: "09:00", location: "市民グラウンド" },
];

// 作成者は管理者にする
const { data: adminMember } = await admin
  .from("school_members")
  .select("user_id")
  .eq("school_id", school.id)
  .eq("role", "admin")
  .limit(1)
  .single();

const { data: insertedEvents, error: eventError } = await admin
  .from("events")
  .insert(
    EVENTS.map((e) => ({
      school_id: school.id,
      title: e.title,
      type: e.type,
      starts_at: jst(e.date, e.time),
      location: e.location,
      created_by: adminMember.user_id,
    })),
  )
  .select("id, title, starts_at");
must("イベント作成", { error: eventError });

console.log(`イベント ${insertedEvents.length} 件を作成しました。`);

// ── 出欠 ───────────────────────────────────────────────────────────────
// 過去のイベントはほぼ全員が回答済み。先のイベントほど未回答を残す。
const { data: guardianByChild } = await admin
  .from("children")
  .select("id, guardian_id")
  .eq("school_id", school.id);
const guardianOf = new Map(guardianByChild.map((c) => [c.id, c.guardian_id]));

const now = Date.now();
let answered = 0;

for (const event of insertedEvents) {
  const daysAhead = (new Date(event.starts_at).getTime() - now) / 86400000;
  // 過去=100%、直近=8割、先=3割ほどが回答済み
  const answerRate = daysAhead < 0 ? 1 : daysAhead < 14 ? 0.8 : 0.3;

  const rows = [];
  for (const child of allChildren) {
    if (rand() > answerRate) continue; // 未回答（行を作らない＝未定）
    rows.push({
      event_id: event.id,
      child_id: child.id,
      status: rand() < 0.82 ? "attending" : "absent",
      updated_by: guardianOf.get(child.id),
    });
  }

  if (rows.length > 0) {
    must("出欠作成", await admin.from("attendance").insert(rows));
    answered += rows.length;
  }
}

console.log(`出欠を ${answered} 件登録しました。`);

// ── 変更履歴のサンプル ─────────────────────────────────────────────────
// 「直前に欠席へ変えた」「管理者が代理で訂正した」を追えることを見せるため、
// 一部の出欠を実際に更新して履歴を作る（トリガーが自動記録する）。
const upcoming = insertedEvents.filter((e) => new Date(e.starts_at).getTime() > now);

if (upcoming.length > 0) {
  const target = upcoming[0];
  const { data: someRows } = await admin
    .from("attendance")
    .select("id, child_id, status")
    .eq("event_id", target.id)
    .limit(4);

  for (const [i, row] of (someRows ?? []).entries()) {
    const flipped = row.status === "attending" ? "absent" : "attending";
    // 半分は保護者本人、半分は管理者による代理変更にする
    const changedBy = i % 2 === 0 ? guardianOf.get(row.child_id) : adminMember.user_id;
    must(
      "出欠更新",
      await admin
        .from("attendance")
        .update({ status: flipped, updated_by: changedBy, updated_at: new Date().toISOString() })
        .eq("id", row.id),
    );
  }
  console.log(`「${target.title}」に変更履歴のサンプルを作りました。`);
}

console.log("\n完了。");
console.log(`  会員: ${allChildren.length} 人`);
console.log(`  イベント: ${insertedEvents.length} 件`);
console.log(`  保護者ログイン: parent01@test.com 〜 parent15@test.com / ${DEMO_PASSWORD}`);
