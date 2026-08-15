// クラスは掛け持ちがあるので複数出る。
// 一覧の1行に収めたい場面では max を指定して「+N」に畳む。
export function ClassBadges({ names, max }: { names: string[]; max?: number }) {
  if (names.length === 0) return null;

  const shown = max ? names.slice(0, max) : names;
  const hidden = names.length - shown.length;

  return (
    <>
      {shown.map((name) => (
        <span
          key={name}
          className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700"
        >
          {name}
        </span>
      ))}
      {hidden > 0 && (
        <span className="shrink-0 text-xs text-gray-400" title={names.join("、")}>
          +{hidden}
        </span>
      )}
    </>
  );
}
