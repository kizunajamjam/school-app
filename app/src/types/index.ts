export type Role = "admin" | "guardian";

export type EventType = "practice" | "match";

export type AttendanceStatus = "attending" | "absent" | "undecided";

export type Profile = {
  id: string;
  displayName: string;
  createdAt: string;
};

export type School = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
};

export type SchoolMember = {
  id: string;
  schoolId: string;
  userId: string;
  role: Role;
  createdAt: string;
};

// カテゴリー(U-10 等の学年区分)とクラス(火曜クラス等)。どちらもスクール単位のマスタ。
export type Category = {
  id: string;
  schoolId: string;
  name: string;
  createdAt: string;
};

export type SchoolClass = {
  id: string;
  schoolId: string;
  name: string;
  createdAt: string;
};

// カテゴリーは1人1つ。クラスは掛け持ちがあるため複数持てる。
export type Child = {
  id: string;
  schoolId: string;
  guardianId: string;
  name: string;
  grade: string | null;
  categoryId: string | null;
  classIds: string[];
  createdAt: string;
};

// 一覧表示用に、紐づくマスタの名前を解決したもの。
export type ChildWithLabels = Child & {
  categoryName: string | null;
  classNames: string[];
};

export type SchoolEvent = {
  id: string;
  schoolId: string;
  title: string;
  type: EventType;
  startsAt: string;
  location: string | null;
  note: string | null;
  createdBy: string;
  createdAt: string;
};

export type Attendance = {
  id: string;
  eventId: string;
  childId: string;
  status: AttendanceStatus;
  updatedBy: string | null;
  updatedAt: string;
};

// 出欠の変更履歴。attendance へのトリガーで自動記録される。
export type AttendanceLog = {
  id: string;
  eventId: string;
  childId: string;
  status: AttendanceStatus;
  changedByName: string | null;
  changedAt: string;
};

export type Invitation = {
  id: string;
  schoolId: string;
  token: string;
  createdBy: string;
  expiresAt: string;
  createdAt: string;
};
