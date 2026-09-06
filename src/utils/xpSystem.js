export const LEVEL_THRESHOLDS = [
  { level: 1, title: "Data Novice", minXp: 0, maxXp: 100 },
  { level: 2, title: "Feature Engineer", minXp: 100, maxXp: 250 },
  { level: 3, title: "Model Builder", minXp: 250, maxXp: 500 },
  { level: 4, title: "Algorithm Whisperer", minXp: 500, maxXp: 900 },
  { level: 5, title: "ML Practitioner", minXp: 900, maxXp: 1500 },
  { level: 6, title: "Data Scientist", minXp: 1500, maxXp: 2500 },
  { level: 7, title: "ML Engineer", minXp: 2500, maxXp: 4000 },
  { level: 8, title: "Research Scientist", minXp: 4000, maxXp: Infinity },
];

export const BADGE_DEFINITIONS = [
  { id: "first_cluster", label: "First Cluster" },
  { id: "on_a_roll", label: "On a Roll" },
  { id: "hot_streak", label: "Hot Streak" },
  { id: "dbscan_master", label: "DBSCAN Master" },
  { id: "algorithm_selector", label: "Algorithm Selector" },
  { id: "param_whisperer", label: "Param Whisperer" },
  { id: "metric_reader", label: "Metric Reader" },
  { id: "hint_free", label: "Hint-Free" },
  { id: "speed_demon", label: "Speed Demon" },
  { id: "daily_warrior", label: "Daily Warrior" },
];

const HINT_MULTIPLIERS = {
  0: 1,
  1: 0.8,
  2: 0.6,
  3: 0.4,
};

/**
 * Computes earned XP for a single answer.
 * @param {{
 *  baseXp: number,
 *  hintsUsed: number,
 *  streak: number,
 *  isDailyChallenge?: boolean,
 * }} input
 * @returns {number}
 */
export const calculateEarnedXP = ({
  baseXp,
  hintsUsed,
  streak,
  isDailyChallenge = false,
}) => {
  const safeHints = Math.max(0, Math.min(3, Number(hintsUsed) || 0));
  const hintMultiplier = HINT_MULTIPLIERS[safeHints] ?? 0.4;
  const streakMultiplier = streak >= 3 ? 1.1 : 1;
  const dailyMultiplier = isDailyChallenge ? 2 : 1;
  return Math.round(baseXp * hintMultiplier * streakMultiplier * dailyMultiplier);
};

/**
 * Returns level metadata for total XP.
 * @param {number} xp
 * @returns {{ level: number, title: string, minXp: number, maxXp: number }}
 */
export const getLevelFromXP = (xp) => {
  const safeXp = Math.max(0, Number(xp) || 0);
  return (
    LEVEL_THRESHOLDS.find(
      (threshold) => safeXp >= threshold.minXp && safeXp < threshold.maxXp
    ) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  );
};

/**
 * Returns progress values for level bar rendering.
 * @param {number} xp
 * @returns {{ level: number, title: string, progress: number, currentInLevel: number, levelSpan: number, nextXp: number | null }}
 */
export const getLevelProgress = (xp) => {
  const levelMeta = getLevelFromXP(xp);
  const safeXp = Math.max(0, Number(xp) || 0);
  if (!Number.isFinite(levelMeta.maxXp)) {
    return {
      level: levelMeta.level,
      title: levelMeta.title,
      progress: 1,
      currentInLevel: safeXp - levelMeta.minXp,
      levelSpan: safeXp - levelMeta.minXp,
      nextXp: null,
    };
  }

  const levelSpan = Math.max(1, levelMeta.maxXp - levelMeta.minXp);
  const currentInLevel = Math.max(0, safeXp - levelMeta.minXp);
  return {
    level: levelMeta.level,
    title: levelMeta.title,
    progress: Math.max(0, Math.min(1, currentInLevel / levelSpan)),
    currentInLevel,
    levelSpan,
    nextXp: levelMeta.maxXp,
  };
};

/**
 * Returns badge metadata from id.
 * @param {string} badgeId
 * @returns {{ id: string, label: string }}
 */
export const getBadgeById = (badgeId) =>
  BADGE_DEFINITIONS.find((badge) => badge.id === badgeId) || {
    id: badgeId,
    label: badgeId,
  };

export default {
  BADGE_DEFINITIONS,
  LEVEL_THRESHOLDS,
  calculateEarnedXP,
  getBadgeById,
  getLevelFromXP,
  getLevelProgress,
};
