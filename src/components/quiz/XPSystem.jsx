import { getLevelProgress } from "../../utils/xpSystem";

/**
 * Displays XP progress toward the next level.
 * @param {{ xp: number }} props
 * @returns {JSX.Element}
 */
export const XPSystem = ({ xp }) => {
  const progress = getLevelProgress(xp);
  const progressPct = Math.round(progress.progress * 100);

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold text-slate-800">Level {progress.level}</p>
        <p className="text-slate-500">{progress.title}</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="text-xs text-slate-600">
        {progress.nextXp == null
          ? `${xp} XP`
          : `${progress.currentInLevel}/${progress.levelSpan} XP toward next level`}
      </p>
    </div>
  );
};

export default XPSystem;
